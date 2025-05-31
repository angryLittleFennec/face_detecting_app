import logging
import os
import cv2
import numpy as np
import dlib
import requests
from ultralytics import YOLO
from threading import Thread, Lock
from queue import Queue
import time
from datetime import datetime
import torch
import torch.cuda
from torch.cuda import Stream
from sqlalchemy import Column, ForeignKey, Integer, String, Text, DateTime, create_engine
from sqlalchemy.orm import sessionmaker, Session, relationship
from sqlalchemy.ext.declarative import declarative_base
from typing import Dict, Tuple, List
import json

# Настройки RTSP
RTSP_INPUT_URL = os.getenv("RTSP_IN", "rtsp://mediamtx-svc:8554/mediamtx/stream3")
RTSP_OUTPUT_URL = os.getenv("RTSP_OUT", "rtsp://mediamtx-svc:8554/mediamtx/newstream1")

# Настройка логгера
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('frame_processing.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Проверка доступности CUDA и настройка
DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'
if DEVICE == 'cuda':
    torch.backends.cudnn.benchmark = True  # Оптимизация для фиксированного размера входных данных
    torch.backends.cudnn.deterministic = False  # Отключаем детерминированность для скорости
    torch.cuda.empty_cache()  # Очищаем кэш GPU
    CUDA_STREAM = Stream()  # Создаем CUDA поток для асинхронных операций

logger.info(f"Using device: {DEVICE}")
if DEVICE == 'cuda':
    logger.info(f"CUDA Device: {torch.cuda.get_device_name(0)}")
    logger.info(f"CUDA Memory allocated: {torch.cuda.memory_allocated(0) / 1024**2:.2f} MB")
    logger.info(f"CUDA Memory cached: {torch.cuda.memory_reserved(0) / 1024**2:.2f} MB")

logger.info(f"RTSP_INPUT_URL: {RTSP_INPUT_URL}")
logger.info(f"RTSP_OUTPUT_URL: {RTSP_OUTPUT_URL}")

# Глобальные переменные для синхронизации
face_lock = Lock()
used_faces = []  # Список для хранения уже распознанных лиц
url = "http://face-recognition-svc:80/find_face"
LOGGING_SERVICE_URL = "http://logging-service:8001"

# Очередь для кадров
frame_queue = Queue(maxsize=30)

# Загрузка моделей с оптимизацией
FACE_MODEL = YOLO("ml_models/yolov8n-face.pt")

# Оптимизация YOLO
FACE_MODEL.conf = 0.5  # Снижаем порог уверенности для лучшего обнаружения
FACE_MODEL.iou = 0.45   # Увеличиваем IoU для более точного трекинга
FACE_MODEL.max_det = 5  # Увеличиваем максимальное количество детекций
FACE_MODEL.agnostic = True
FACE_MODEL.classes = [0]  # Только лица

# Перемещаем модель на GPU если доступно
FACE_MODEL.to(DEVICE)
logger.info(f"YOLO model moved to {DEVICE}")

# Предварительная инициализация детектора лиц
face_detector = dlib.get_frontal_face_detector()
shape_predictor = dlib.shape_predictor("ml_models/shape_predictor_68_face_landmarks.dat")
face_rec_model = dlib.face_recognition_model_v1("ml_models/dlib_face_recognition_resnet_model_v1.dat")

# Словари для хранения информации о лицах
tracked_faces = {}  # {track_id: {"name": name, "first_seen": timestamp, "last_seen": timestamp}}
active_tracks = set()  # Множество активных track_id в текущем кадре
frame_count = 0

# Настройки базы данных
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:secret@postgres-postgresql:5432/surveillance_db")
Base = declarative_base()

# Модели SQLAlchemy
class Person(Base):
    __tablename__ = "persons"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    faces = relationship("Face", back_populates="person", cascade="all, delete-orphan")

class Face(Base):
    __tablename__ = "faces"
    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, ForeignKey('persons.id', ondelete="CASCADE"))
    encoding = Column(Text, nullable=False)
    person = relationship("Person", back_populates="faces")

# Инициализация базы данных
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# Кэш для хранения эмбеддингов лиц
face_embeddings_cache: Dict[int, Tuple[np.ndarray, str]] = {}

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def load_face_embeddings():
    """Загружает все эмбеддинги лиц из базы данных в кэш"""
    global face_embeddings_cache
    try:
        db = SessionLocal()
        # Получаем все лица с именами людей
        faces = db.query(Face, Person.name, Person.id).join(Person).all()
        
        # Очищаем кэш
        face_embeddings_cache.clear()
        
        # Загружаем эмбеддинги в кэш
        for face, person_name, person_id in faces:
            try:
                encoding = np.fromstring(face.encoding, sep=',')
                if encoding.shape == (128,):
                    face_embeddings_cache[person_id] = (encoding, person_name)
            except Exception as e:
                logger.error(f"Error loading face {face.id}: {e}")
                continue
                
        logger.info(f"Loaded {len(face_embeddings_cache)} face embeddings into cache")
    except Exception as e:
        logger.error(f"Error loading face embeddings: {e}")
    finally:
        db.close()

# Загружаем эмбеддинги при старте
load_face_embeddings()

def find_matching_face(embedding: np.ndarray) -> Tuple[str, int]:
    """Ищет совпадение среди сохранённых лиц в кэше"""
    try:
        if not isinstance(embedding, np.ndarray):
            logger.error("Error: embedding is not a numpy array")
            return None, None
            
        if embedding.shape != (128,):
            logger.error(f"Error: invalid embedding shape: {embedding.shape}")
            return None, None
            
        min_dist = float("inf")
        best_match = None
        best_match_id = None
        
        # Ищем совпадение в кэше
        for face_id, (cached_encoding, person_name) in face_embeddings_cache.items():
            try:
                # Вычисляем евклидово расстояние
                dist = np.linalg.norm(cached_encoding - embedding)
                
                # Если расстояние меньше порога и минимальное, обновляем лучший результат
                if dist < 0.6 and dist < min_dist:
                    min_dist = dist
                    best_match = person_name
                    best_match_id = face_id
                    
            except Exception as e:
                logger.error(f"Error processing face {face_id}: {e}")
                continue
        
        if best_match and best_match_id is not None:
            logger.info(f"Found matching person: {best_match} with ID: {best_match_id}")
            return best_match, best_match_id
        else:
            logger.info("No matching face found")
            return None, None
            
    except Exception as e:
        logger.error(f"Error in find_matching_face: {e}")
        return None, None

def log_face_event(track_id, event_type, name=None, person_id=None):
    """Логирование событий с лицами через микросервис логирования"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    try:
        # Создаем событие через микросервис логирования
        if event_type in ["enter", "exit"]:  # Логируем только входы и выходы
            duration = None
            if event_type == "exit" and track_id in tracked_faces:
                duration = int((tracked_faces[track_id]["last_seen"] - tracked_faces[track_id]["first_seen"]))
            
            # Проверяем наличие person_id перед отправкой события
            if person_id is not None:
                event_data = {
                    "event_type": event_type,
                    "person_id": person_id,
                    "stream_processor_id": 1,  # TODO: Получать ID процессора из конфигурации
                    "track_id": track_id,
                    "duration": duration
                }
                
                try:
                    response = requests.post(
                        f"{LOGGING_SERVICE_URL}/events/",
                        json=event_data,
                        timeout=5
                    )
                    if response.status_code != 200:
                        logger.error(f"Failed to log event: {response.text}")
                except requests.exceptions.RequestException as e:
                    logger.error(f"Error sending event to logging service: {e}")
            else:
                logger.warning(f"Skipping event logging for track_id {track_id} - no person_id available")
        
        # Логируем в файл для отладки
        if event_type == "enter":
            if name:
                logger.info(f"🟢 {timestamp} - {name} вошел в кадр")
            else:
                logger.info(f"🟢 {timestamp} - Неизвестный человек (ID: {track_id}) вошел в кадр")
        elif event_type == "recognized":
            logger.info(f"👤 {timestamp} - Распознан человек: {name} (ID: {track_id})")
        elif event_type == "exit":
            if track_id in tracked_faces:
                if tracked_faces[track_id]["name"]:
                    duration = tracked_faces[track_id]["last_seen"] - tracked_faces[track_id]["first_seen"]
                    logger.info(f"🔴 {timestamp} - {tracked_faces[track_id]['name']} вышел из кадра. Время в кадре: {duration:.1f} сек")
                else:
                    duration = tracked_faces[track_id]["last_seen"] - tracked_faces[track_id]["first_seen"]
                    logger.info(f"🔴 {timestamp} - Неизвестный человек (ID: {track_id}) вышел из кадра. Время в кадре: {duration:.1f} сек")
    except Exception as e:
        logger.error(f"Error logging face event: {e}")

def get_face_embedding(image: np.ndarray):
    if image.size == 0:
        return None

    try:
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        dets = face_detector(rgb_image, 1)
        if len(dets) == 0:
            return None

        shape = shape_predictor(rgb_image, dets[0])
        face_descriptor = face_rec_model.compute_face_descriptor(rgb_image, shape, num_jitters=1)
        return np.array(face_descriptor)
    except Exception as e:
        logger.error(f"Error in get_face_embedding: {e}")
        return None

def process_frame(frame, frame_id, out):
    global frame_count, active_tracks
    start_time = time.time()
    try:
        # Копирование кадра
        copy_start = time.time()
        annotated_frame = frame.copy()
        copy_time = time.time() - copy_start
        
        # Оптимизация размера изображения
        resize_start = time.time()
        scale_percent = 30  # Увеличиваем размер изображения для лучшего качества
        width = int(frame.shape[1] * scale_percent / 100)
        height = int(frame.shape[0] * scale_percent / 100)
        resized_frame = cv2.resize(frame, (width, height), interpolation=cv2.INTER_LINEAR)
        resize_time = time.time() - resize_start
        
        logger.info(f"Original frame size: {frame.shape}, Resized frame size: {resized_frame.shape}")
        
        # Запускаем YOLO с отслеживанием на GPU с оптимизациями
        yolo_start = time.time()
        with torch.cuda.amp.autocast():  # Используем автоматическое смешанное вычисление
            with torch.no_grad():
                if DEVICE == 'cuda':
                    with torch.cuda.stream(CUDA_STREAM):
                        results = FACE_MODEL.track(
                            resized_frame,
                            verbose=False,
                            stream=False,
                            persist=True,
                            conf=0.5,  # Снижаем порог уверенности
                            iou=0.45,  # Увеличиваем IoU
                            max_det=5,  # Увеличиваем количество детекций
                            device=DEVICE
                        )
                        torch.cuda.current_stream().synchronize()  # Синхронизируем CUDA поток
                else:
                    results = FACE_MODEL.track(
                        resized_frame,
                        verbose=False,
                        stream=False,
                        persist=True,
                        conf=0.5,  # Снижаем порог уверенности
                        iou=0.45,  # Увеличиваем IoU
                        max_det=5,  # Увеличиваем количество детекций
                        device=DEVICE
                    )
        yolo_time = time.time() - yolo_start

        # Оптимизация работы с тензорами
        if DEVICE == 'cuda':
            torch.cuda.empty_cache()  # Очищаем неиспользуемую память GPU

        # Масштабируем координаты обратно к оригинальному размеру
        scale_x = frame.shape[1] / width
        scale_y = frame.shape[0] / height
        
        face_recognition_time = 0
        faces_processed = 0
        
        # Очищаем множество активных треков для нового кадра
        current_tracks = set()
        
        # Обрабатываем результаты из генератора
        process_results_start = time.time()
        
        # Получаем все боксы сразу с оптимизацией для GPU
        boxes_start = time.time()
        boxes = []
        if results[0].boxes.id is not None:
            if DEVICE == 'cuda':
                boxes = results[0].boxes.cpu()  # Перемещаем данные на CPU для обработки
            else:
                boxes = results[0].boxes
        boxes_time = time.time() - boxes_start
        
        # Предварительно вычисляем масштабированные координаты
        scaling_start = time.time()
        scaled_boxes = []
        if len(boxes) > 0:
            for box in boxes:
                if int(box.cls) == 0:  # Класс 0 соответствует лицу
                    # Получаем координаты
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    track_id = int(box.id.item())
                    
                    # Масштабируем координаты
                    x1 = int(x1 * scale_x)
                    y1 = int(y1 * scale_y)
                    x2 = int(x2 * scale_x)
                    y2 = int(y2 * scale_y)
                    
                    # Добавляем отступы
                    padding = 20
                    x1 = max(0, x1 - padding)
                    y1 = max(0, y1 - padding)
                    x2 = min(frame.shape[1], x2 + padding)
                    y2 = min(frame.shape[0], y2 + padding)
                    
                    scaled_boxes.append({
                        'track_id': track_id,
                        'coords': (x1, y1, x2, y2),
                        'face_image': frame[y1:y2, x1:x2]
                    })
        scaling_time = time.time() - scaling_start
        
        # Обрабатываем все боксы
        processing_start = time.time()
        face_recognition_total = 0
        face_embedding_total = 0
        face_matching_total = 0
        drawing_total = 0
        
        # Словарь для отслеживания person_id по track_id
        current_person_tracks = {}
        
        for box_data in scaled_boxes:
            faces_processed += 1
            track_id = box_data['track_id']
            x1, y1, x2, y2 = box_data['coords']
            face_image = box_data['face_image']
            current_tracks.add(track_id)
            
            # Проверяем, новый ли это трек
            if track_id not in tracked_faces:
                # Создаем запись в tracked_faces
                tracked_faces[track_id] = {
                    "name": None,
                    "person_id": None,
                    "first_seen": time.time(),
                    "last_seen": time.time(),
                    "event_sent": False  # Флаг для отслеживания отправки события
                }
                
                # Сначала пытаемся распознать лицо
                face_start = time.time()
                embedding = get_face_embedding(face_image)
                face_embedding_total += time.time() - face_start
                
                if embedding is not None:
                    match_start = time.time()
                    match, match_id = find_matching_face(embedding)
                    face_matching_total += time.time() - match_start
                    
                    if match:
                        # Обновляем информацию о лице
                        tracked_faces[track_id]["name"] = match
                        tracked_faces[track_id]["person_id"] = match_id
                        current_person_tracks[match_id] = track_id
                        
                        # Отправляем событие начала только если для этого person_id еще нет активного трека
                        if match_id not in current_person_tracks or current_person_tracks[match_id] == track_id:
                            log_face_event(track_id, "enter", match, match_id)
                            tracked_faces[track_id]["event_sent"] = True
                        else:
                            logger.warning(f"Person {match} (ID: {match_id}) already has active track {current_person_tracks[match_id]}, skipping enter event for track {track_id}")
            
            # Обновляем время последнего появления
            tracked_faces[track_id]["last_seen"] = time.time()
            
            # Если лицо еще не распознано, пробуем распознать
            if tracked_faces[track_id]["name"] is None:
                face_start = time.time()
                embedding = get_face_embedding(face_image)
                face_embedding_total += time.time() - face_start
                
                if embedding is not None:
                    match_start = time.time()
                    match, match_id = find_matching_face(embedding)
                    if match:
                        # При распознавании обновляем имя и отправляем событие
                        tracked_faces[track_id]["name"] = match
                        tracked_faces[track_id]["person_id"] = match_id
                        current_person_tracks[match_id] = track_id
                        
                        # Отправляем событие только если для этого person_id еще нет активного трека
                        if match_id not in current_person_tracks or current_person_tracks[match_id] == track_id:
                            if not tracked_faces[track_id]["event_sent"]:
                                log_face_event(track_id, "enter", match, match_id)
                                tracked_faces[track_id]["event_sent"] = True
                        else:
                            logger.warning(f"Person {match} (ID: {match_id}) already has active track {current_person_tracks[match_id]}, skipping enter event for track {track_id}")
                    face_matching_total += time.time() - match_start
                face_recognition_total += time.time() - face_start
            
            # Отображаем информацию о лице, если оно распознано
            if tracked_faces[track_id]["name"]:
                name = tracked_faces[track_id]["name"]
                cv2.putText(annotated_frame, name, (x1 + 100, y1 - 10),
                          cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
                cv2.putText(annotated_frame, f"ID: {track_id}", (x1, y1 - 10),
                          cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
        
        processing_time = time.time() - processing_start
        process_results_time = time.time() - process_results_start
        
        # Проверяем, какие треки исчезли
        check_tracks_start = time.time()
        for track_id in active_tracks - current_tracks:
            if track_id in tracked_faces:
                # Отправляем событие конца только если:
                # 1. Было отправлено событие начала
                # 2. Это последний активный трек для данного person_id
                person_id = tracked_faces[track_id]["person_id"]
                if person_id is not None:
                    if tracked_faces[track_id]["event_sent"] and (person_id not in current_person_tracks or current_person_tracks[person_id] == track_id):
                        log_face_event(track_id, "exit", tracked_faces[track_id]["name"], person_id)
                    else:
                        logger.warning(f"Skipping exit event for track {track_id} (person_id: {person_id}) as it's not the last active track")
                # Удаляем трек из словаря
                del tracked_faces[track_id]
        check_tracks_time = time.time() - check_tracks_start
        
        # Обновляем множество активных треков
        active_tracks = current_tracks
        
        total_time = time.time() - start_time
        
        # Логируем время обработки с детальной разбивкой
        logger.info(
            f"Frame {frame_id} processed in {process_results_time:.3f}s | "
            f"Copy: {copy_time:.3f}s | "
            f"Resize: {resize_time:.3f}s | "
            f"YOLO: {yolo_time:.3f}s | "
            f"Process results: {process_results_time:.3f}s ("
            f"boxes: {boxes_time:.3f}s, "
            f"scaling: {scaling_time:.3f}s, "
            f"processing: {processing_time:.3f}s ["
            f"embedding: {face_embedding_total:.3f}s, "
            f"matching: {face_matching_total:.3f}s, "
            f"drawing: {drawing_total:.3f}s]) | "
            f"Faces detected: {faces_processed} | "
            f"Active tracks: {len(active_tracks)}"
        )
        
        # Записываем обработанный кадр
        out.write(annotated_frame)
        return True
    except Exception as e:
        logger.error(f"Error in process_frame: {e}")
        return False

def process_frames(out):
    frame_count = 0
    total_processing_time = 0
    
    while True:
        if not frame_queue.empty():
            frame = frame_queue.get()
            if frame is None:
                if frame_count > 0:
                    avg_time = total_processing_time / frame_count
                    logger.info(f"Average frame processing time: {avg_time:.3f}s over {frame_count} frames")
                break
            
            start_time = time.time()
            success = process_frame(frame, frame_count, out)
            processing_time = time.time() - start_time
            
            if success:
                total_processing_time += processing_time
                frame_count += 1

def open_capture_with_retry(url, max_retries=5, retry_delay=3):
    for attempt in range(max_retries):
        cap = cv2.VideoCapture(url)
        if cap.isOpened():
            print(f"✅ Connected to stream on attempt {attempt+1}")
            return cap
        print(f"⚠️ Connection attempt {attempt+1}/{max_retries} failed, retrying in {retry_delay}s...")
        time.sleep(retry_delay)
    return None

def process_stream():
    """Основная функция обработки стрима с механизмом переподключения"""
    while True:
        try:
            # Инициализация захвата видео
            cap = open_capture_with_retry(RTSP_INPUT_URL)
            if cap is None:
                logger.error("❌ Error: Could not connect to RTSP stream after multiple attempts!")
                time.sleep(5)  # Ждем перед следующей попыткой
                continue

            # Настройка параметров видео
            frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = cap.get(cv2.CAP_PROP_FPS) or 30

            logger.info(f"🎥 Input stream opened: {frame_width}x{frame_height} at {fps} FPS")
            logger.info(f"🔄 Forwarding to {RTSP_OUTPUT_URL}")

            # Настройка GStreamer для вывода RTSP с оптимизацией
            out = cv2.VideoWriter(
                f'appsrc ! videoconvert ! video/x-raw,format=I420 ! '
                f'x264enc speed-preset=ultrafast bitrate=1024 key-int-max={int(fps*2)} ! '
                f'video/x-h264,profile=baseline ! rtspclientsink protocols=tcp location={RTSP_OUTPUT_URL}',
                cv2.CAP_GSTREAMER, 0, fps, (frame_width, frame_height), True
            )

            if not out.isOpened():
                logger.error("❌ Error: Cannot open RTSP output stream!")
                cap.release()
                time.sleep(5)
                continue

            # Запуск потока обработки
            processor_thread = Thread(target=process_frames, args=(out,))
            processor_thread.start()

            # Основной цикл чтения кадров
            frame_count = 0
            start_time = time.time()
            last_frame_time = time.time()
            timeout = 10  # Таймаут в секундах

            while cap.isOpened():
                ret, frame = cap.read()
                current_time = time.time()
                
                if not ret:
                    # Проверяем, не превышен ли таймаут
                    if current_time - last_frame_time > timeout:
                        logger.error("❌ Error: Stream timeout - no frames received")
                        break
                    logger.warning("⚠️ Failed to read frame from RTSP stream, retrying...")
                    time.sleep(0.1)
                    continue

                last_frame_time = current_time
                frame_queue.put(frame)
                frame_count += 1

                # Вывод FPS каждые 30 секунд
                if frame_count % 900 == 0:  # 30 секунд при 30 FPS
                    elapsed_time = current_time - start_time
                    current_fps = frame_count / elapsed_time
                    logger.info(f"Current FPS: {current_fps:.2f}")
                    frame_count = 0
                    start_time = current_time

            # Остановка потока при выходе из цикла
            frame_queue.put(None)
            processor_thread.join()

            # Освобождение ресурсов
            out.release()
            cap.release()
            
            logger.info("🔄 Stream connection lost, attempting to reconnect...")
            time.sleep(5)  # Пауза перед переподключением
            
        except Exception as e:
            logger.error(f"❌ Unexpected error in stream processing: {e}")
            time.sleep(5)  # Пауза перед следующей попыткой

if __name__ == "__main__":
    try:
        process_stream()
    except KeyboardInterrupt:
        logger.info("👋 Shutting down gracefully...")
        # Очистка ресурсов при выходе
        if 'cap' in locals():
            cap.release()
        if 'out' in locals():
            out.release()
        cv2.destroyAllWindows()