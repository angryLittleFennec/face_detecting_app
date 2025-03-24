def start_video_processing(camera_id: int):
    # Заглушка для запуска обработки видеопотока
    # В реальном приложении здесь можно отправить сообщение в очередь задач
    print(f"Запуск обработки видеопотока для камеры {camera_id}")

def stop_video_processing(camera_id: int):
    # Заглушка для остановки обработки видеопотока
    print(f"Остановка обработки видеопотока для камеры {camera_id}")

# def create_pdf_from_logs():
#     pdf = FPDF()
#     pdf.add_page()
#     pdf.set_font("Arial", size=12)

#     with open("person_detection.log", "r") as log_file:
#         for line in log_file:
#             pdf.cell(200, 10, txt=line, ln=True)

#     pdf.output("person_detection_report.pdf")