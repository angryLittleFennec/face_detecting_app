FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .

RUN apt-get update

RUN pip install --no-cache-dir -r requirements.txt

RUN pip install --break-system-packages schedule
RUN pip install --break-system-packages fpdf
RUN pip install --break-system-packages pytelegrambotapi

COPY . .

EXPOSE 8090

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]