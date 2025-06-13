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
import subprocess

RTSP_INPUT_URL = os.getenv("RTSP_IN", "rtsp://mediamtx-svc:8554/mediamtx/stream3")
RTSP_OUTPUT_URL = os.getenv("RTSP_OUT", "rtsp://mediamtx-svc:8554/mediamtx/newstream1")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('frame_processing.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'
if DEVICE == 'cuda':
    torch.backends.cudnn.benchmark = True
    torch.backends.cudnn.deterministic = False
    torch.cuda.empty_cache()
    CUDA_STREAM = Stream()

logger.info(f"Using device: {DEVICE}")
if DEVICE == 'cuda':
    logger.info(f"CUDA Device: {torch.cuda.get_device_name(0)}")
    logger.info(f"CUDA Memory allocated: {torch.cuda.memory_allocated(0) / 1024**2:.2f} MB")
    logger.info(f"CUDA Memory cached: {torch.cuda.memory_reserved(0) / 1024**2:.2f} MB")

logger.info(f"RTSP_INPUT_URL: {RTSP_INPUT_URL}")
logger.info(f"RTSP_OUTPUT_URL: {RTSP_OUTPUT_URL}")

face_lock = Lock()
used_faces = []
url = "http://face-recognition-svc:80/find_face"
LOGGING_SERVICE_URL = "http://logging-service:8001"

frame_queue = Queue(maxsize=30)
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

face_detector = dlib.get_frontal_face_detector()
shape_predictor = dlib.shape_predictor("ml_models/shape_predictor_68_face_landmarks.dat")
face_rec_model = dlib.face_recognition_model_v1("ml_models/dlib_face_recognition_resnet_model_v1.dat")

tracked_faces = {}
active_tracks = set()
frame_count = 0

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:secret@postgres-postgresql:5432/surveillance_db")
Base = declarative_base()

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

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

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
        faces = db.query(Face, Person.name, Person.id).join(Person).all()
        
        face_embeddings_cache.clear()
        
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
        
        for face_id, (cached_encoding, person_name) in face_embeddings_cache.items():
            try:
                dist = np.linalg.norm(cached_encoding - embedding)
                
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
        if event_type in ["enter", "exit"]:
            duration = None
            if event_type == "exit" and track_id in tracked_faces:
                duration = int((tracked_faces[track_id]["last_seen"] - tracked_faces[track_id]["first_seen"]))
            if person_id is not None:
                event_data = {
                    "event_type": event_type,
                    "person_id": person_id,
                    "stream_processor_id": 1,
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
        
        if event_type == "enter":
            if name:
                logger.info(f"{timestamp} - {name} вошел в кадр")
            else:
                logger.info(f"{timestamp} - Неизвестный человек (ID: {track_id}) вошел в кадр")
        elif event_type == "recognized":
            logger.info(f"👤 {timestamp} - Распознан человек: {name} (ID: {track_id})")
        elif event_type == "exit":
            if track_id in tracked_faces:
                if tracked_faces[track_id]["name"]:
                    duration = tracked_faces[track_id]["last_seen"] - tracked_faces[track_id]["first_seen"]
                    logger.info(f"{timestamp} - {tracked_faces[track_id]['name']} вышел из кадра. Время в кадре: {duration:.1f} сек")
                else:
                    duration = tracked_faces[track_id]["last_seen"] - tracked_faces[track_id]["first_seen"]
                    logger.info(f"{timestamp} - Неизвестный человек (ID: {track_id}) вышел из кадра. Время в кадре: {duration:.1f} сек")
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

def process_frame(frame, frame_id, ffmpeg_process):
    global frame_count, active_tracks
    try:
        if frame is None or frame.size == 0:
            logger.warning("Received invalid frame, skipping...")
            return True
            
        if frame.shape[0] == 0 or frame.shape[1] == 0:
            logger.warning("Frame has invalid dimensions, skipping...")
            return True
            
        if frame.dtype != np.uint8 or len(frame.shape) != 3 or frame.shape[2] != 3:
            logger.warning(f"Invalid frame format: dtype={frame.dtype}, shape={frame.shape}, skipping...")
            return True

        if len(tracked_faces) > 0:
            annotated_frame = frame.copy()
        else:
            annotated_frame = frame
        
        scale_percent = 25
        width = int(frame.shape[1] * scale_percent / 100)
        height = int(frame.shape[0] * scale_percent / 100)
        resized_frame = cv2.resize(frame, (width, height), interpolation=cv2.INTER_NEAREST)
        
        with torch.cuda.amp.autocast():
            with torch.no_grad():
                if DEVICE == 'cuda':
                    with torch.cuda.stream(CUDA_STREAM):
                        results = FACE_MODEL.track(
                            resized_frame,
                            verbose=False,
                            stream=False,
                            persist=True,
                            conf=0.6,
                            iou=0.5,
                            max_det=3,
                            device=DEVICE
                        )
                        torch.cuda.current_stream().synchronize()
                else:
                    results = FACE_MODEL.track(
                        resized_frame,
                        verbose=False,
                        stream=False,
                        persist=True,
                        conf=0.6,
                        iou=0.5,
                        max_det=3,
                        device=DEVICE
                    )

        if DEVICE == 'cuda':
            torch.cuda.empty_cache()

        scale_x = frame.shape[1] / width
        scale_y = frame.shape[0] / height
        
        current_tracks = set()
        
        boxes = []
        if results[0].boxes.id is not None:
            if DEVICE == 'cuda':
                boxes = results[0].boxes.cpu()
            else:
                boxes = results[0].boxes
        
        scaled_boxes = []
        if len(boxes) > 0:
            for box in boxes:
                if int(box.cls) == 0:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    track_id = int(box.id.item())
                    x1 = int(x1 * scale_x)
                    y1 = int(y1 * scale_y)
                    x2 = int(x2 * scale_x)
                    y2 = int(y2 * scale_y)
                    
                    padding = 10
                    x1 = max(0, x1 - padding)
                    y1 = max(0, y1 - padding)
                    x2 = min(frame.shape[1], x2 + padding)
                    y2 = min(frame.shape[0], y2 + padding)
                    
                    scaled_boxes.append({
                        'track_id': track_id,
                        'coords': (x1, y1, x2, y2),
                        'face_image': frame[y1:y2, x1:x2]
                    })
        current_person_tracks = {}
        
        for box_data in scaled_boxes:
            track_id = box_data['track_id']
            x1, y1, x2, y2 = box_data['coords']
            face_image = box_data['face_image']
            current_tracks.add(track_id)
            
            if track_id not in tracked_faces:
                tracked_faces[track_id] = {
                    "name": None,
                    "person_id": None,
                    "first_seen": time.time(),
                    "last_seen": time.time(),
                    "event_sent": False
                }
                
                embedding = get_face_embedding(face_image)
                
                if embedding is not None:
                    match, match_id = find_matching_face(embedding)
                    
                    if match:
                        tracked_faces[track_id]["name"] = match
                        tracked_faces[track_id]["person_id"] = match_id
                        current_person_tracks[match_id] = track_id
                        
                        if match_id not in current_person_tracks or current_person_tracks[match_id] == track_id:
                            log_face_event(track_id, "enter", match, match_id)
                            tracked_faces[track_id]["event_sent"] = True
            
            tracked_faces[track_id]["last_seen"] = time.time()
            
            if tracked_faces[track_id]["name"] is None:
                embedding = get_face_embedding(face_image)
                
                if embedding is not None:
                    match, match_id = find_matching_face(embedding)
                    if match:
                        tracked_faces[track_id]["name"] = match
                        tracked_faces[track_id]["person_id"] = match_id
                        current_person_tracks[match_id] = track_id
                        
                        if match_id not in current_person_tracks or current_person_tracks[match_id] == track_id:
                            if not tracked_faces[track_id]["event_sent"]:
                                log_face_event(track_id, "enter", match, match_id)
                                tracked_faces[track_id]["event_sent"] = True
            
            if tracked_faces[track_id]["name"]:
                name = tracked_faces[track_id]["name"]
                cv2.putText(annotated_frame, name, (x1 + 100, y1 - 10),
                          cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
                cv2.putText(annotated_frame, f"ID: {track_id}", (x1, y1 - 10),
                          cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
        
        for track_id in active_tracks - current_tracks:
            if track_id in tracked_faces:
                person_id = tracked_faces[track_id]["person_id"]
                if person_id is not None:
                    if tracked_faces[track_id]["event_sent"] and (person_id not in current_person_tracks or current_person_tracks[person_id] == track_id):
                        log_face_event(track_id, "exit", tracked_faces[track_id]["name"], person_id)
                del tracked_faces[track_id]
        
        active_tracks = current_tracks
        try:
            if ffmpeg_process.poll() is None:
                ffmpeg_process.stdin.write(annotated_frame.tobytes())
            else:
                logger.error("FFmpeg process is not running")
                return False
        except IOError as e:
            logger.error(f"Error writing to FFmpeg: {e}")
            return False
            
        return True
    except Exception as e:
        logger.error(f"Error in process_frame: {e}")
        return True

def process_frames(ffmpeg_process):
    frame_count = 0
    total_processing_time = 0
    start_time = time.time()
    last_fps_time = start_time
    consecutive_errors = 0
    max_consecutive_errors = 5
    frame_interval = 1.0 / 30.0
    last_frame_time = start_time
    
    while True:
        if not frame_queue.empty():
            frame = frame_queue.get()
            if frame is None:
                if frame_count > 0:
                    avg_time = total_processing_time / frame_count
                    logger.info(f"Average frame processing time: {avg_time:.3f}s over {frame_count} frames")
                break
            
            try:
                current_time = time.time()
                elapsed = current_time - last_frame_time
                if elapsed < frame_interval:
                    time.sleep(frame_interval - elapsed)
                
                frame_start_time = time.time()
                success = process_frame(frame, frame_count, ffmpeg_process)
                frame_processing_time = time.time() - frame_start_time
                
                if not success:
                    consecutive_errors += 1
                    logger.error(f"Failed to process frame (consecutive errors: {consecutive_errors})")
                    if consecutive_errors >= max_consecutive_errors:
                        logger.error("Too many consecutive errors, breaking processing loop")
                        break
                    continue
                else:
                    consecutive_errors = 0
                
                frame_count += 1
                total_processing_time += frame_processing_time
                last_frame_time = time.time()

                current_time = time.time()
                if current_time - last_fps_time >= 30:
                    elapsed_time = current_time - last_fps_time
                    current_fps = frame_count / elapsed_time
                    logger.info(f"Current FPS: {current_fps:.2f}")
                    frame_count = 0
                    total_processing_time = 0
                    last_fps_time = current_time
            except Exception as e:
                logger.error(f"Error in process_frames: {e}")
                consecutive_errors += 1
                if consecutive_errors >= max_consecutive_errors:
                    logger.error("Too many consecutive errors, breaking processing loop")
                    break
                continue

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
            cap = open_capture_with_retry(RTSP_INPUT_URL)
            if cap is None:
                logger.error("Error: Could not connect to RTSP stream after multiple attempts!")
                time.sleep(5)
                continue

            frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = cap.get(cv2.CAP_PROP_FPS) or 30
            frame_interval = 1.0 / fps

            logger.info(f"🎥 Input stream opened: {frame_width}x{frame_height} at {fps} FPS")
            logger.info(f"🔄 Forwarding to {RTSP_OUTPUT_URL}")

            while True:
                try:
                    command = [
                        'ffmpeg',
                        '-y',
                        '-f', 'rawvideo',
                        '-vcodec', 'rawvideo',
                        '-pix_fmt', 'bgr24',
                        '-s', f'{frame_width}x{frame_height}',
                        '-r', str(fps),
                        '-i', '-',
                        '-c:v', 'libx264',
                        '-preset', 'veryfast',
                        '-tune', 'zerolatency',
                        '-b:v', '4000k',
                        '-maxrate', '4000k',
                        '-bufsize', '8000k',
                        '-g', str(int(fps)),
                        '-profile:v', 'main',
                        '-pix_fmt', 'yuv420p',
                        '-x264opts', 'no-scenecut',
                        '-f', 'rtsp',
                        '-rtsp_transport', 'tcp',
                        RTSP_OUTPUT_URL
                    ]
                    
                    ffmpeg_process = subprocess.Popen(
                        command,
                        stdin=subprocess.PIPE,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        universal_newlines=False
                    )

                    if not ffmpeg_process:
                        logger.error("Error: Cannot start FFmpeg process!")
                        break

                    def log_ffmpeg_output(process, stream_name):
                        for line in process:
                            if line:
                                try:
                                    decoded_line = line.decode('utf-8').strip()
                                    if decoded_line:
                                        logger.info(f"FFmpeg {stream_name}: {decoded_line}")
                                except UnicodeDecodeError:
                                    continue

                    stdout_thread = Thread(target=log_ffmpeg_output, args=(ffmpeg_process.stdout, "stdout"))
                    stderr_thread = Thread(target=log_ffmpeg_output, args=(ffmpeg_process.stderr, "stderr"))
                    stdout_thread.daemon = True
                    stderr_thread.daemon = True
                    stdout_thread.start()
                    stderr_thread.start()

                    processor_thread = Thread(target=process_frames, args=(ffmpeg_process,))
                    processor_thread.start()

                    frame_count = 0
                    start_time = time.time()
                    last_frame_time = time.time()
                    timeout = 10

                    while cap.isOpened():
                        ret, frame = cap.read()
                        current_time = time.time()
                        
                        if not ret:
                            if current_time - last_frame_time > timeout:
                                logger.error("Error: Stream timeout - no frames received")
                                break
                            logger.warning("Failed to read frame from RTSP stream, retrying...")
                            time.sleep(0.1)
                            continue

                        elapsed = current_time - last_frame_time
                        if elapsed < frame_interval:
                            time.sleep(frame_interval - elapsed)
                        
                        last_frame_time = time.time()
                        
                        if ffmpeg_process.poll() is not None:
                            logger.error(f"FFmpeg process terminated with code {ffmpeg_process.returncode}")
                            stdout, stderr = ffmpeg_process.communicate()
                            if stdout:
                                logger.error(f"FFmpeg stdout: {stdout}")
                            if stderr:
                                logger.error(f"FFmpeg stderr: {stderr}")
                            break

                        try:
                            frame_queue.put(frame)
                            frame_count += 1
                        except Exception as e:
                            logger.error(f"Error putting frame to queue: {e}")
                            break

                    frame_queue.put(None)
                    processor_thread.join()

                    try:
                        if ffmpeg_process.poll() is None:
                            ffmpeg_process.stdin.close()
                            ffmpeg_process.terminate()
                            ffmpeg_process.wait(timeout=5)
                    except Exception as e:
                        logger.error(f"Error closing FFmpeg process: {e}")

                    logger.info("🔄 FFmpeg connection lost, attempting to reconnect...")
                    time.sleep(5)

                except Exception as e:
                    logger.error(f"Error in FFmpeg processing: {e}")
                    time.sleep(5)
                    continue
            cap.release()
            
        except Exception as e:
            logger.error(f"Unexpected error in stream processing: {e}")
            time.sleep(5)

if __name__ == "__main__":
    try:
        process_stream()
    except KeyboardInterrupt:
        logger.info("👋 Shutting down gracefully...")
        if 'cap' in locals():
            cap.release()
        if 'ffmpeg_process' in locals():
            ffmpeg_process.stdin.close()
            ffmpeg_process.terminate()
            ffmpeg_process.wait()
        cv2.destroyAllWindows()