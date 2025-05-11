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
LOGGING_SERVICE_URL = "http://logging_service:8000/log"

# Очередь для кадров
frame_queue = Queue(maxsize=30)

# Загрузка моделей с оптимизацией
FACE_MODEL = YOLO("ml_models/yolov8n-face.pt")

# Оптимизация YOLO
FACE_MODEL.conf = 0.7  # Увеличиваем порог уверенности
FACE_MODEL.iou = 0.3   # Низкий IoU для ускорения
FACE_MODEL.verbose = False
FACE_MODEL.max_det = 3  # Уменьшаем максимальное количество детекций
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

def log_face_event(track_id, event_type, name=None):
    """Логирование событий с лицами"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if event_type == "enter":
        logger.info(f"🟢 {timestamp} - Человек {name or track_id} вошел в кадр")
    elif event_type == "exit":
        duration = tracked_faces[track_id]["last_seen"] - tracked_faces[track_id]["first_seen"]
        logger.info(f"🔴 {timestamp} - Человек {name or track_id} вышел из кадра. Время в кадре: {duration:.1f} сек")
    elif event_type == "recognized":
        logger.info(f"👤 {timestamp} - Распознан человек: {name} (ID: {track_id})")

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

def find_matching_face(embedding):
    try:
        encoding_str = ",".join(map(str, embedding))
        params = {"embedding_str": encoding_str}
        response = requests.get(url, params=params, timeout=1)
        if response.status_code == 200:
            js = response.json()
            return js['person'] if js['status'] == 'success' else None
    except Exception as e:
        logger.error(f"Error in find_matching_face: {e}")
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
        scale_percent = 20  # Уменьшаем размер изображения
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
                            conf=0.7,
                            iou=0.3,
                            max_det=3,
                            device=DEVICE
                        )
                        torch.cuda.current_stream().synchronize()  # Синхронизируем CUDA поток
                else:
                    results = FACE_MODEL.track(
                        resized_frame,
                        verbose=False,
                        stream=False,
                        persist=True,
                        conf=0.7,
                        iou=0.3,
                        max_det=3,
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
        
        for box_data in scaled_boxes:
            faces_processed += 1
            track_id = box_data['track_id']
            x1, y1, x2, y2 = box_data['coords']
            face_image = box_data['face_image']
            current_tracks.add(track_id)
            
            # Проверяем, новый ли это трек
            if track_id not in tracked_faces:
                tracked_faces[track_id] = {
                    "name": None,
                    "first_seen": time.time(),
                    "last_seen": time.time()
                }
                log_face_event(track_id, "enter")
            
            # Обновляем время последнего появления
            tracked_faces[track_id]["last_seen"] = time.time()
            
            # Если лицо еще не распознано, пробуем распознать
            if tracked_faces[track_id]["name"] is None:
                face_start = time.time()
                embedding = get_face_embedding(face_image)
                face_embedding_total += time.time() - face_start
                
                if embedding is not None:
                    match_start = time.time()
                    # with face_lock:
                    #     match = find_matching_face(embedding)
                    #     if match:
                    #         tracked_faces[track_id]["name"] = match
                    #         log_face_event(track_id, "recognized", match)
                    face_matching_total += time.time() - match_start
                face_recognition_total += time.time() - face_start
            
            # Отображаем информацию о лице
            draw_start = time.time()
            name = tracked_faces[track_id]["name"] or f"Unknown-{track_id}"
            cv2.putText(annotated_frame, name, (x1 + 100, y1 - 10),
                      cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
            cv2.putText(annotated_frame, f"ID: {track_id}", (x1, y1 - 10),
                      cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
            drawing_total += time.time() - draw_start
        
        processing_time = time.time() - processing_start
        process_results_time = time.time() - process_results_start
        
        # Проверяем, какие треки исчезли
        check_tracks_start = time.time()
        for track_id in active_tracks - current_tracks:
            if track_id in tracked_faces:
                log_face_event(track_id, "exit", tracked_faces[track_id]["name"])
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

# Инициализация захвата видео
cap = open_capture_with_retry(RTSP_INPUT_URL)
if cap is None:
    print("❌ Error: Could not connect to RTSP stream after multiple attempts!")
    exit()

# Настройка параметров видео
frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS) or 30

print(f"🎥 Input stream opened: {frame_width}x{frame_height} at {fps} FPS")
print(f"🔄 Forwarding to {RTSP_OUTPUT_URL}")

# Настройка GStreamer для вывода RTSP с оптимизацией
out = cv2.VideoWriter(
    f'appsrc ! videoconvert ! video/x-raw,format=I420 ! '
    f'x264enc speed-preset=ultrafast bitrate=1024 key-int-max={int(fps*2)} ! '
    f'video/x-h264,profile=baseline ! rtspclientsink protocols=tcp location={RTSP_OUTPUT_URL}',
    cv2.CAP_GSTREAMER, 0, fps, (frame_width, frame_height), True
)

if not out.isOpened():
    print("❌ Error: Cannot open RTSP output stream!")
    cap.release()
    exit()

# Запуск потока обработки
processor_thread = Thread(target=process_frames, args=(out,))
processor_thread.start()

# Основной цикл чтения кадров
frame_count = 0
start_time = time.time()

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        print("❌ Error: Failed to read frame from RTSP stream!")
        break

    frame_queue.put(frame)
    frame_count += 1

    # Вывод FPS каждые 30 секунд
    if frame_count % 900 == 0:  # 30 секунд при 30 FPS
        elapsed_time = time.time() - start_time
        current_fps = frame_count / elapsed_time
        print(f"Current FPS: {current_fps:.2f}")
        frame_count = 0
        start_time = time.time()

# Остановка потока
frame_queue.put(None)
processor_thread.join()

# Освобождение ресурсов
out.release()
cap.release()