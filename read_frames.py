import cv2
import numpy as np
import dlib
import requests
from ultralytics import YOLO
from threading import Thread
from queue import Queue
import argparse
import time

# Настройки RTSP
RTSP_INPUT_URL = "rtsp://mediamtx:8554/mediamtx/stream"
RTSP_OUTPUT_URL = "rtsp://mediamtx:8554/5"

# Загрузка моделей
FACE_MODEL = YOLO("ml_models/yolov8n-face.pt")  # Модель для распознавания лиц
OBJECT_MODEL = YOLO("ml_models/yolov8n.pt")  # Модель для обнаружения объектов
HELMET_MODEL = YOLO("ml_models/hemletYoloV8_100epochs.pt")  # Модель для обнаружения шлемов
face_detector = dlib.get_frontal_face_detector()
shape_predictor = dlib.shape_predictor("ml_models/shape_predictor_68_face_landmarks.dat")
face_rec_model = dlib.face_recognition_model_v1("ml_models/dlib_face_recognition_resnet_model_v1.dat")

used_faces = []  # Список для хранения уже распознанных лиц
url = "http://face_recognition:8000/find_face"
LOGGING_SERVICE_URL = "http://logging_service:8000/log"  # URL сервиса логирования

# Очередь для кадров
frame_queue = Queue(maxsize=10)

# Функция для извлечения эмбеддинга лица
def get_face_embedding(image: np.ndarray):
    if image.size == 0:
        return None

    # Преобразование изображения в RGB
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

# Функция для поиска совпадения лица
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

# Функция для отправки логов в сервис логирования
def send_log_to_service(log_message):
    try:
        response = requests.post(LOGGING_SERVICE_URL, json={"message": log_message})
        if response.status_code != 200:
            print(f"Failed to send log: {response.text}")
    except Exception as e:
        print(f"Error sending log: {e}")

# Функция для обработки кадров
def process_frames(parameters):
    while True:
        if not frame_queue.empty():
            frame = frame_queue.get()
            if frame is None:
                break

            annotated_frame = frame.copy()

            # Применение модели в зависимости от параметров
            if "person" in parameters:
                # Обработка лиц
                results = FACE_MODEL(frame)
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
                                        # Логирование нового лица
                                        log_message = f"Person '{match}' entered the camera vision."
                                        send_log_to_service(log_message)
                                        used_faces.append((match, embedding))
                                if match:
                                    # Добавление текста с именем на кадр
                                    cv2.putText(frame, match, (x1, y1 - 10),
                                                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
                                    cv2.rectangle(frame, (x1, y1), (x2, y2), color=(0, 255, 0))
                                    
            if "car" in parameters or "cell phone" in parameters or "traffic light" in parameters:
                # Обработка объектов
                results = OBJECT_MODEL(frame)
                annotated_frame = results[0].plot(conf=False)

                # Фильтрация объектов по выбранным параметрам
                for result in results:
                    for box in result.boxes:
                        class_id = int(box.cls)
                        class_name = OBJECT_MODEL.names[class_id]
                        if class_name in parameters:
                            x1, y1, x2, y2 = map(int, box.xyxy[0])
                            # Добавление текста с именем класса на кадр
                            cv2.putText(annotated_frame, class_name, (x1, y1 - 10),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

            if "helmet" in parameters:
                # Обработка шлемов
                results = HELMET_MODEL(frame)
                annotated_frame = results[0].plot(conf=False)

                # Фильтрация объектов по выбранным параметрам
                for result in results:
                    for box in result.boxes:
                        class_id = int(box.cls)
                        class_name = HELMET_MODEL.names[class_id]
                        if class_name == "helmet":  # Проверка на класс "шлем"
                            x1, y1, x2, y2 = map(int, box.xyxy[0])
                            # Добавление текста с именем класса на кадр
                            cv2.putText(annotated_frame, class_name, (x1, y1 - 10),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

            # Отправка обработанного кадра в выходной RTSP-поток
            out.write(frame)

# Парсинг аргументов командной строки
parser = argparse.ArgumentParser(description="Process video stream with specific parameters.")
parser.add_argument(
    "--parameters", 
    nargs="+", 
    choices=["person", "car", "cell phone", "traffic light", "helmet"], 
    default=[],  # Changed default to an empty list
    help="List of parameters to process: person, car, cell phone, traffic light, helmet."
)
args = parser.parse_args()

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
processor_thread = Thread(target=process_frames, args=(args.parameters,))
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