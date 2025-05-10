import logging
import os
import cv2
import numpy as np
import dlib
import requests
from ultralytics import YOLO
from threading import Thread, Lock
from queue import Queue
import argparse
import time
import sys
from collections import deque

# Настраиваем логирование для Kubernetes
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)  # Выводим в stdout для Kubernetes
    ]
)
logger = logging.getLogger(__name__)

# Отключаем логи OpenCV и YOLO
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|buffer_size;4096|stimeout;2000000|max_delay;200000|flags;low_delay|err_detect;ignore_err|skip_frame;0|skip_loop_filter;48|flags2;showall|fflags;nobuffer|analyzeduration;1000000|probesize;32"

# Настройки RTSP
RTSP_INPUT_URL = os.getenv("RTSP_IN", "rtsp://mediamtx-svc:8554/mediamtx/stream3")
RTSP_OUTPUT_URL = os.getenv("RTSP_OUT", "rtsp://mediamtx-svc:8554/mediamtx/newstream1")

# Настройки YOLO
FACE_MODEL = YOLO("ml_models/yolov8n-face.pt")
FACE_MODEL.conf = 0.5
FACE_MODEL.iou = 0.45
FACE_MODEL.agnostic = True
FACE_MODEL.max_det = 10
FACE_MODEL.classes = None
FACE_MODEL.verbose = False

# Оптимизация размера изображения
TARGET_WIDTH = 640
TARGET_HEIGHT = 360
YOLO_WIDTH = 640  # Размер для YOLO
YOLO_HEIGHT = 360

# Оптимизация обработки
process_every_n_frames = 5  # Обрабатываем каждый 5-й кадр
face_recognition_interval = 5  # Распознаем лица на каждом 5-м кадре

# Настройки YOLO
OBJECT_MODEL = YOLO("ml_models/yolov8n.pt")  # Модель для обнаружения объектов
HELMET_MODEL = YOLO("ml_models/hemletYoloV8_100epochs.pt")  # Модель для обнаружения шлемов
face_detector = dlib.get_frontal_face_detector()
shape_predictor = dlib.shape_predictor("ml_models/shape_predictor_68_face_landmarks.dat")
face_rec_model = dlib.face_recognition_model_v1("ml_models/dlib_face_recognition_resnet_model_v1.dat")

used_faces = []  # Список для хранения уже распознанных лиц
url = "http://face-recognition-svc:80/find_face"
LOGGING_SERVICE_URL = "http://logging_service:8000/log"  # URL сервиса логирования

# Оптимизация буфера
frame_queue = Queue(maxsize=3)
detection_queue = Queue(maxsize=3)
detection_lock = Lock()

# Статистика обработки
frame_times = []
target_fps = 30
last_face_recognition_time = 0

# Кэш для эмбеддингов лиц
face_embedding_cache = {}
CACHE_SIZE = 100  # Максимальный размер кэша

# Кэш для последних детекций
last_detections = []  # Список последних обнаруженных лиц
MAX_DETECTIONS_CACHE = 10  # Размер кэша
detection_lifetime = 10  # Время жизни детекции в кадрах

# Настройки интерполяции
current_interpolation = []  # Текущие интерполированные позиции

# Добавляем класс для профилирования
class Profiler:
    def __init__(self, window_size=100):
        self.times = {}
        self.window_size = window_size
        self.windows = {}
    
    def start(self, name):
        if name not in self.times:
            self.times[name] = []
            self.windows[name] = deque(maxlen=self.window_size)
        self.times[name].append(time.time())
    
    def stop(self, name):
        if name in self.times and self.times[name]:
            elapsed = time.time() - self.times[name].pop()
            self.windows[name].append(elapsed)
            return elapsed
        return 0
    
    def get_stats(self, name):
        if name in self.windows and self.windows[name]:
            times = list(self.windows[name])
            return {
                'avg': sum(times) / len(times),
                'min': min(times),
                'max': max(times),
                'last': times[-1]
            }
        return None
    
    def log_stats(self, logger):
        logger.info("=" * 50)
        logger.info("ПРОФИЛИРОВАНИЕ ПРОИЗВОДИТЕЛЬНОСТИ:")
        logger.info("=" * 50)
        for name in self.windows:
            stats = self.get_stats(name)
            if stats:
                logger.info(f"{name:20} | avg: {stats['avg']*1000:6.2f}ms | min: {stats['min']*1000:6.2f}ms | max: {stats['max']*1000:6.2f}ms | last: {stats['last']*1000:6.2f}ms")
        logger.info("=" * 50)

# Создаем глобальный профилировщик
profiler = Profiler(window_size=100)

def scale_coordinates(x1, y1, x2, y2, scale_x, scale_y):
    """Масштабирует координаты обратно к исходному размеру"""
    return (
        int(x1 * scale_x),
        int(y1 * scale_y),
        int(x2 * scale_x),
        int(y2 * scale_y)
    )

# Функция для извлечения эмбеддинга лица
def get_face_embedding(image: np.ndarray):
    """Извлекает эмбеддинг лица"""
    if image.size == 0:
        return None

    try:
        # Преобразование изображения в RGB
        if image.shape[2] == 3 and image.dtype == np.uint8:
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        else:
            rgb_image = image

        # Обнаружение лиц
        dets = face_detector(rgb_image, 1)
        if len(dets) == 0:
            logger.debug("Лицо не обнаружено в ROI")
            return None

        # Получение ключевых точек лица
        shape = shape_predictor(rgb_image, dets[0])

        # Извлечение эмбеддинга лица
        face_descriptor = face_rec_model.compute_face_descriptor(rgb_image, shape, num_jitters=1)
        embedding = np.array(face_descriptor)
        logger.debug("Эмбеддинг лица успешно извлечен")
        return embedding
    except Exception as e:
        logger.error(f"Ошибка при извлечении эмбеддинга лица: {str(e)}")
        return None

# Функция для поиска совпадения лица
def find_matching_face(embedding):
    """Ищет совпадение лица в базе данных"""
    try:
        logger.debug("Начало поиска совпадения лица")
        encoding_str = ",".join(map(str, embedding))
        params = {"embedding_str": encoding_str}
        
        logger.debug(f"Отправка запроса к сервису распознавания лиц: {url}")
        response = requests.get(url, params=params, timeout=2)  # Увеличиваем таймаут
        
        if response.status_code == 200:
            js = response.json()
            logger.debug(f"Ответ сервиса: {js}")
            
            if js.get('status') == 'success':
                person = js.get('person')
                logger.info(f"Найдено совпадение: {person}")
                return person
            else:
                logger.debug("Совпадение не найдено")
                return None
        else:
            logger.error(f"Ошибка при запросе к сервису. Статус: {response.status_code}")
            return None
    except requests.exceptions.Timeout:
        logger.error("Превышено время ожидания ответа от сервиса распознавания лиц")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"Ошибка при запросе к сервису распознавания лиц: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Неожиданная ошибка при поиске совпадения лица: {str(e)}")
        return None

# Функция для отправки логов в сервис логирования
def send_log_to_service(log_message):
    try:
        response = requests.post(LOGGING_SERVICE_URL, json={"message": log_message})
        if response.status_code != 200:
            print(f"Failed to send log: {response.text}")
    except Exception as e:
        print(f"Error sending log: {e}")

# Функция для переподключения к RTSP потоку
def reconnect_rtsp(max_retries=5, retry_delay=3):
    for attempt in range(max_retries):
        try:
            cap = cv2.VideoCapture(RTSP_INPUT_URL)
            if cap.isOpened():
                cap.set(cv2.CAP_PROP_BUFFERSIZE, 3)
                cap.set(cv2.CAP_PROP_FPS, 30)
                logger.info(f"✅ Успешное подключение к потоку на попытке {attempt+1}")
                return cap
        except Exception as e:
            logger.error(f"Ошибка при подключении к потоку: {str(e)}")
        
        logger.warning(f"⚠️ Попытка подключения {attempt+1}/{max_retries} не удалась, повтор через {retry_delay}с...")
        time.sleep(retry_delay)
    
    logger.error("❌ Не удалось подключиться к RTSP потоку после всех попыток")
    return None

def interpolate_detections(old_dets, new_dets, alpha):
    """Интерполирует между старыми и новыми детекциями"""
    interpolated = []
    
    # Создаем словари для быстрого поиска
    old_dict = {det['box']: det for det in old_dets}
    new_dict = {det['box']: det for det in new_dets}
    
    # Интерполируем существующие детекции
    for old_det in old_dets:
        old_box = old_det['box']
        if old_box in new_dict:
            # Если детекция существует в обоих кадрах, интерполируем
            new_box = new_dict[old_box]['box']
            x1 = int(old_box[0] + (new_box[0] - old_box[0]) * alpha)
            y1 = int(old_box[1] + (new_box[1] - old_box[1]) * alpha)
            x2 = int(old_box[2] + (new_box[2] - old_box[2]) * alpha)
            y2 = int(old_box[3] + (new_box[3] - old_box[3]) * alpha)
            
            # Интерполируем уверенность
            conf = old_det['conf'] + (new_dict[old_box]['conf'] - old_det['conf']) * alpha
            
            interpolated.append({
                'box': (x1, y1, x2, y2),
                'conf': conf,
                'time': old_det['time'],
                'person': old_det['person']
            })
        elif alpha < 0.7:  # Увеличиваем время жизни исчезающих детекций
            # Если детекция исчезает, показываем её дольше
            interpolated.append(old_det)
    
    # Добавляем новые детекции
    for new_det in new_dets:
        new_box = new_det['box']
        if new_box not in old_dict and alpha > 0.3:  # Раньше показываем новые детекции
            interpolated.append(new_det)
    
    return interpolated

def update_detection_cache(boxes, frame_count):
    """Обновляет кэш детекций"""
    global last_detections
    
    # Удаляем устаревшие детекции
    last_detections = [d for d in last_detections if frame_count - d['frame'] < detection_lifetime]
    
    # Добавляем новые детекции
    new_detections = []
    for box in boxes:
        try:
            # Проверяем тип box и извлекаем координаты соответственно
            if hasattr(box, 'xyxy'):
                # Если это объект YOLO
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                conf = box.conf[0].cpu().numpy()
            elif isinstance(box, dict) and 'box' in box:
                # Если это словарь с координатами
                x1, y1, x2, y2 = box['box']
                conf = box['conf']
            else:
                logger.warning(f"Неизвестный формат box: {type(box)}")
                continue
                
            if conf > 0.5:
                new_detections.append({
                    'box': (int(x1), int(y1), int(x2), int(y2)),
                    'conf': float(conf),
                    'frame': frame_count,
                    'person': None
                })
        except Exception as e:
            logger.error(f"Ошибка при обработке box: {str(e)}")
            continue
    
    # Обновляем кэш
    last_detections = new_detections
    if len(last_detections) > MAX_DETECTIONS_CACHE:
        last_detections = last_detections[-MAX_DETECTIONS_CACHE:]

def draw_detections(frame, detections):
    """Отрисовывает детекции на кадре"""
    for det in detections:
        x1, y1, x2, y2 = det['box']
        person = det['person']
        conf = det['conf']
        
        # Отрисовка рамки с прозрачностью
        overlay = frame.copy()
        # Используем прозрачность в зависимости от уверенности
        alpha = 0.3 + 0.4 * conf  # Прозрачность от 0.3 до 0.7
        cv2.rectangle(overlay, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)
        
        # Отрисовка имени, если есть
        if person:
            cv2.putText(frame, person, (x1, y1-10), 
                      cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

def process_detection(frame, model):
    """Обработка детекции в отдельном потоке"""
    try:
        results = model(frame, verbose=False)
        return results
    except Exception as e:
        logger.error(f"Ошибка при детекции: {str(e)}")
        return None

def detection_worker():
    """Рабочий поток для детекции"""
    while True:
        if not frame_queue.empty():
            frame = frame_queue.get()
            if frame is None:
                break
                
            profiler.start('yolo_detection')
            results = process_detection(frame, FACE_MODEL)
            profiler.stop('yolo_detection')
            
            if results is not None:
                detection_queue.put(results)
            else:
                detection_queue.put(None)

def resize_frame(frame, target_width, target_height, buffer=None, interpolation=cv2.INTER_LINEAR):
    """Оптимизированный ресайз кадра с проверкой качества"""
    try:
        if frame is None or frame.size == 0:
            logger.error("Получен пустой кадр для ресайза")
            return None
            
        if frame.shape[2] != 3:
            logger.error(f"Неверное количество каналов: {frame.shape[2]}")
            return None
            
        # Проверяем размеры входного кадра
        h, w = frame.shape[:2]
        if w < target_width or h < target_height:
            logger.warning(f"Входной кадр ({w}x{h}) меньше целевого размера ({target_width}x{target_height})")
            interpolation = cv2.INTER_CUBIC  # Используем более качественную интерполяцию для увеличения
            
        # Используем предварительно созданный буфер если он предоставлен
        if buffer is not None:
            cv2.resize(frame, (target_width, target_height), dst=buffer, interpolation=interpolation)
            return buffer
        else:
            return cv2.resize(frame, (target_width, target_height), interpolation=interpolation)
            
    except Exception as e:
        logger.error(f"Ошибка при ресайзе кадра: {str(e)}")
        return None

def process_frames(parameters):
    global last_face_recognition_time
    frame_count = 0
    start_time = time.time()
    error_count = 0
    max_errors = 10
    
    # Вычисляем коэффициенты масштабирования
    scale_x = TARGET_WIDTH / YOLO_WIDTH
    scale_y = TARGET_HEIGHT / YOLO_HEIGHT
    
    logger.info(f"Коэффициенты масштабирования: X={scale_x:.2f}, Y={scale_y:.2f}")
    logger.info(f"Размер YOLO: {YOLO_WIDTH}x{YOLO_HEIGHT}")
    logger.info(f"Размер отображения: {TARGET_WIDTH}x{TARGET_HEIGHT}")
    
    # Запускаем поток детекции
    detection_thread = Thread(target=detection_worker)
    detection_thread.start()
    
    while True:
        if not frame_queue.empty():
            frame = frame_queue.get()
            if frame is None:
                break

            try:
                profiler.start('total_frame')
                
                if frame is not None and frame.size > 0:
                    # Ресайз для отображения
                    profiler.start('resize_display')
                    display_frame = resize_frame(frame, TARGET_WIDTH, TARGET_HEIGHT)
                    profiler.stop('resize_display')
                    
                    if display_frame is None:
                        logger.error("Ошибка при ресайзе для отображения")
                        continue
                    
                    if frame_count % process_every_n_frames == 0:
                        # Ресайз для YOLO
                        profiler.start('resize_yolo')
                        yolo_frame = resize_frame(frame, YOLO_WIDTH, YOLO_HEIGHT)
                        profiler.stop('resize_yolo')
                        
                        if yolo_frame is None:
                            logger.error("Ошибка при ресайзе для YOLO")
                            continue
                            
                        # Отправляем кадр в очередь детекции
                        frame_queue.put(yolo_frame.copy())
                        
                        # Получаем результаты детекции
                        results = detection_queue.get()
                        
                        if results is not None:
                            for result in results:
                                boxes = result.boxes
                                scaled_boxes = []
                                profiler.start('process_boxes')
                                for box in boxes:
                                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                                    conf = box.conf[0].cpu().numpy()
                                    if conf > 0.5:
                                        # Масштабируем координаты к размеру отображения
                                        x1, y1, x2, y2 = scale_coordinates(x1, y1, x2, y2, scale_x, scale_y)
                                        logger.debug(f"Детекция: conf={conf:.2f}, box=({x1}, {y1}, {x2}, {y2})")
                                        scaled_boxes.append({
                                            'box': (int(x1), int(y1), int(x2), int(y2)),
                                            'conf': float(conf),
                                            'frame': frame_count,
                                            'person': None
                                        })
                                profiler.stop('process_boxes')
                                
                                with detection_lock:
                                    profiler.start('update_cache')
                                    update_detection_cache(scaled_boxes, frame_count)
                                    profiler.stop('update_cache')
                                
                                # Обрабатываем новые детекции
                                profiler.start('face_recognition')
                                for det in scaled_boxes:
                                    x1, y1, x2, y2 = det['box']
                                    if frame_count % face_recognition_interval == 0:
                                        face_roi = frame[y1:y2, x1:x2]
                                        if face_roi.size > 0:
                                            logger.debug(f"Обработка ROI размера {face_roi.shape}")
                                            embedding = get_face_embedding(face_roi)
                                            if embedding is not None:
                                                person = find_matching_face(embedding)
                                                with detection_lock:
                                                    for d in last_detections:
                                                        if d['box'] == (x1, y1, x2, y2):
                                                            d['person'] = person
                                profiler.stop('face_recognition')
                    
                    # Отрисовываем детекции на кадре для отображения
                    profiler.start('draw_detections')
                    with detection_lock:
                        draw_detections(display_frame, last_detections)
                    profiler.stop('draw_detections')
                    
                    # Отправляем обработанный кадр
                    profiler.start('write_frame')
                    out.write(display_frame)
                    profiler.stop('write_frame')
                    
                    # Измерение времени обработки
                    total_time = profiler.stop('total_frame')
                    frame_times.append(total_time)
                    frame_count += 1
                    error_count = 0
                    
                    # Логирование статистики каждые 30 секунд
                    if frame_count % 900 == 0:
                        elapsed_time = time.time() - start_time
                        current_fps = frame_count / elapsed_time
                        avg_frame_time = sum(frame_times[-900:]) / len(frame_times[-900:])
                        logger.info("\n" + "=" * 50)
                        logger.info("СТАТИСТИКА ПРОИЗВОДИТЕЛЬНОСТИ:")
                        logger.info("=" * 50)
                        logger.info(f"FPS: {current_fps:.2f}")
                        logger.info(f"Среднее время обработки кадра: {avg_frame_time*1000:.2f} мс")
                        logger.info(f"Целевой FPS: {target_fps}")
                        logger.info(f"Обработано кадров: {frame_count}")
                        logger.info(f"Время работы: {elapsed_time:.1f} сек")
                        profiler.log_stats(logger)
                else:
                    logger.warning("Получен пустой или некорректный кадр")
                    
            except Exception as e:
                error_count += 1
                logger.error(f"Ошибка при обработке кадра: {str(e)}")
                if error_count >= max_errors:
                    logger.error("Превышено максимальное количество ошибок, переподключение...")
                    return
    
    # Останавливаем поток детекции
    frame_queue.put(None)
    detection_thread.join()

# Парсинг аргументов командной строки
parser = argparse.ArgumentParser(description="Process video stream with specific parameters.")
parser.add_argument(
    "--parameters", 
    nargs="+", 
    choices=["person", "car", "cell phone", "traffic light", "helmet"], 
    default=["person"],  # Changed default to an empty list
    help="List of parameters to process: person, car, cell phone, traffic light, helmet."
)
args = parser.parse_args()

# Основной цикл обработки
while True:
    cap = reconnect_rtsp()
    if cap is None:
        logger.error("Не удалось подключиться к потоку, завершение работы")
        break

    # Получение параметров видео
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    # Логируем параметры входного потока
    logger.info(f"Параметры входного потока:")
    logger.info(f"Размер: {frame_width}x{frame_height}")
    logger.info(f"FPS: {fps}")
    logger.info(f"Формат: {cap.get(cv2.CAP_PROP_FOURCC)}")
    logger.info(f"Буфер: {cap.get(cv2.CAP_PROP_BUFFERSIZE)}")

    if fps <= 0:
        logger.warning("⚠️ Не удалось получить FPS, устанавливаем значение по умолчанию: 30")
        fps = 30

    logger.info(f"🎥 Входной поток: {frame_width}x{frame_height} при {fps} FPS")
    logger.info(f"🔄 Перенаправление на {RTSP_OUTPUT_URL}")

    # Оптимизированные настройки GStreamer для вывода RTSP
    gst_pipeline = (
        f'appsrc ! videoconvert ! video/x-raw,format=I420 ! '
        f'x264enc speed-preset=ultrafast tune=zerolatency bitrate=4096 key-int-max=30 ! '  # Увеличиваем битрейт
        f'video/x-h264,profile=baseline ! rtspclientsink location={RTSP_OUTPUT_URL} protocols=tcp'
    )
    logger.info(f"GStreamer pipeline: {gst_pipeline}")
    
    out = cv2.VideoWriter(
        gst_pipeline,
        cv2.CAP_GSTREAMER, 0, fps, (TARGET_WIDTH, TARGET_HEIGHT), True
    )

    if not out.isOpened():
        logger.error("❌ Не удалось открыть выходной RTSP поток!")
        cap.release()
        continue

    # Запуск потока для обработки кадров
    processor_thread = Thread(target=process_frames, args=(args.parameters,))
    processor_thread.start()

    frame_ind = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            logger.error("❌ Ошибка при чтении кадра из RTSP потока!")
            break

        # Отправляем кадр в очередь, даже если он поврежден
        if not frame_queue.full():
            frame_queue.put(frame)
        frame_ind += 1

    # Остановка потока обработки
    frame_queue.put(None)
    processor_thread.join()

    # Освобождение ресурсов
    out.release()
    cap.release()
    
    logger.info("Переподключение к потоку...")
    time.sleep(3)