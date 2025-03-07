import cv2
import numpy as np
import dlib
import requests
from ultralytics import YOLO
from threading import Thread
from queue import Queue


from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base

# Настройки RTSP
RTSP_INPUT_URL = "rtsp://mediamtx:8554/stream"
RTSP_OUTPUT_URL = "rtsp://mediamtx:8554/5"

# Загрузка модели YOLO
model = YOLO("ml_models/yolov8n-face.pt")
face_detector = dlib.get_frontal_face_detector()
shape_predictor = dlib.shape_predictor("ml_models/shape_predictor_68_face_landmarks.dat")
face_rec_model = dlib.face_recognition_model_v1("ml_models/dlib_face_recognition_resnet_model_v1.dat")

used_faces = []

url = "http://face_recognition:8000/find_face"

def get_face_embedding(image: np.ndarray):
    # Извлекает фичи лица из изображения
    dets = face_detector(image, 1)
    if len(dets) == 0:
        return None
    shape = shape_predictor(image, dets[0])
    face_descriptor = face_rec_model.compute_face_descriptor(image, shape)
    return np.array(face_descriptor)

def find_matching_face(embedding):
    encoding_str = ",".join(map(str, embedding))
    params = {"embedding_str": encoding_str}

    response = requests.get(url, params=params)
    if response.status_code == 200:
        js = response.json()
        if js['status'] == 'success':
            return js['person']
        else:
            return None


frame_queue = Queue(maxsize=10)  # Ограничивает размер очереди

def get_face_embedding(image: np.ndarray):
    # Извлекает эмбеддинг лица из изображения
    if image.size == 0:
        return None

    # Преобразование изображения в RGB, если оно в BGR (как в OpenCV)
    if image.shape[2] == 3 and image.dtype == np.uint8:
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    else:
        rgb_image = image

    # Обнаружение лиц
    dets = face_detector(rgb_image, 1)
    if len(dets) == 0:
        return None

    # Получение ключевых точек лица
    shape = shape_predictor(rgb_image, dets[0])

    # Извлечение эмбеддинга лица
    face_descriptor = face_rec_model.compute_face_descriptor(rgb_image, shape, num_jitters=1)
    return np.array(face_descriptor)



def process_frames():
    # Обрабатывает кадры из очереди
    while True:
        if not frame_queue.empty():
            frame = frame_queue.get()
            if frame is None:
                break

            # Обработка кадра с помощью YOLO
            results = model(frame)
            annotated_frame = results[0].plot(conf=False)


            # Распознавание лиц с помощью dlib
            for result in results:
                for box in result.boxes:
                    if int(box.cls) == 0:  # Класс 0 соответствует лицу в YOLO
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        face_image = frame[y1:y2, x1:x2]

                        # Извлечение эмбеддинга лица
                        embedding = get_face_embedding(face_image)
                        if embedding is not None:
                            # Поиск совпадения в базе данных
                            match = None

                            for name, encoding in used_faces:
                                dist = np.linalg.norm(encoding - embedding)
                                min_dist = float("inf")
                                if dist < 0.6 and dist < min_dist:
                                    match = name
                                    min_dist = dist
                            if match is None:
                                match = find_matching_face(embedding)
                                if match:
                                    used_faces.append((match, embedding))
                            if match:
                                # Добавление текста с именем на кадр
                                cv2.putText(annotated_frame, match, (x1 + 100, y1 - 10),
                                            cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

            # Отправка обработанного кадра в выходной RTSP-поток
            out.write(annotated_frame)

# Открытие RTSP-потока
cap = cv2.VideoCapture(RTSP_INPUT_URL)
if not cap.isOpened():
    print("❌ Error: Cannot open RTSP input stream!")
    exit()

# Получение параметров видео
frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS)

if fps <= 0:
    print("⚠️ Warning: FPS retrieval failed, setting default FPS to 30")
    fps = 30

print(f"🎥 Input stream opened: {frame_width}x{frame_height} at {fps} FPS")
print(f"🔄 Forwarding to {RTSP_OUTPUT_URL}")

# Настройка GStreamer для вывода RTSP
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

# Запуск потока для обработки кадров
processor_thread = Thread(target=process_frames)
processor_thread.start()

frame_ind = 0
while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        print("❌ Error: Failed to read frame from RTSP stream!")
        break

    frame_queue.put(frame)

    frame_ind += 1

# Остановка потока обработки
frame_queue.put(None)
processor_thread.join()

# Освобождение ресурсов
out.release()
cap.release()