from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import logging
from fpdf import FPDF
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import os
import telebot
import schedule
import time
import uuid

app = FastAPI()

# Модель для логов
class LogMessage(BaseModel):
    message: str

# Настройка логирования
logging.basicConfig(
    filename="person_detection.log",  # Имя файла лога
    level=logging.INFO,  # Уровень логирования
    format="%(asctime)s - %(message)s",  # Формат записи лога
    datefmt="%Y-%m-%d %H:%M:%S"  # Формат времени
)

# Функция для создания PDF из логов
def create_pdf_from_logs(uid: str):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)

    with open("person_detection.log", "r") as log_file:
        for line in log_file:
            pdf.cell(200, 10, txt=line, ln=True)

    pdf.output(f"person_detection_report_{uid}.pdf")

# Функция для отправки PDF по email
def send_email_with_pdf(uid):
    sender_email = "surveillanceappreport@gmail.com"
    receiver_email = "13x.skat.x13@gmail.com"
    password = "rcwx mrrb orbn ajpv"

    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = receiver_email
    msg["Subject"] = "Monthly Person Detection Report"

    with open(f"person_detection_report_{uid}.pdf", "rb") as attachment:
        part = MIMEBase("application", "octet-stream")
        part.set_payload(attachment.read())

    encoders.encode_base64(part)
    part.add_header(
        "Content-Disposition",
        f"attachment; filename=person_detection_report.pdf",
    )

    msg.attach(part)

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, receiver_email, msg.as_string())

# Функция для ежемесячной отправки отчета
def monthly_report():
    create_pdf_from_logs()
    send_email_with_pdf()
    os.remove("person_detection_report.pdf")  # Удаление PDF после отправки

def send_logs_every_minute():
    uid = str(uuid.uuid1())
    create_pdf_from_logs(uid)
    send_email_with_pdf(uid)
    os.remove(f"person_detection_report_{uid}.pdf")  # Удаление PDF после отправки

# Планирование задачи на конец каждого месяца
#schedule.every().month.do(monthly_report)
schedule.every(60).minutes.do(send_logs_every_minute)

# Telegram Bot
bot = telebot.TeleBot('8155077211:AAH_Wm2udjRTkd5xFiHYVC8BEYv2r9JGv58')

@bot.message_handler(content_types=['text'])
def get_text_messages(message):
    if message.text == "Привет":
        bot.send_message(message.from_user.id, "Привет, Напиши /report для получения отчета за месяц")
    elif message.text == "/help":
        bot.send_message(message.from_user.id, "Напиши привет")
    elif message.text == "/report":
        uid = str(uuid.uuid1())
        create_pdf_from_logs(uid)
        bot.send_document(message.from_user.id, open(f'person_detection_report_{uid}.pdf', 'rb'))
        os.remove(f"person_detection_report_{uid}.pdf")
    else:
        bot.send_message(message.from_user.id, "Я тебя не понимаю. Напиши /help.")

# Запуск бота в отдельном потоке
def run_bot():
    bot.polling(none_stop=True, interval=0)

# Эндпоинт для приема логов
@app.post("/log")
async def receive_log(log_message: LogMessage):
    logging.info(log_message.message)
    return {"status": "success"}

# Эндпоинт для скачивания логов
@app.get("/download-logs")
async def download_logs():
    uid = str(uuid.uuid1())
    create_pdf_from_logs(uid)
    if not os.path.exists("person_detection_report_{uid}.pdf"):
        raise HTTPException(status_code=404, detail="Log file not found")

    response = FileResponse(
        "person_detection_report.pdf",
        media_type="application/pdf",
        filename="person_detection_report.pdf"
    )
    os.remove("person_detection_report_{uid}.pdf")
    return response

# Запуск планировщика
def run_scheduler():
    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    import threading
    # Запуск бота и планировщика в отдельных потоках
    threading.Thread(target=run_bot).start()
    threading.Thread(target=run_scheduler).start()

    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
