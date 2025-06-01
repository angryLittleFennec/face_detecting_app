#!/bin/bash

# Сборка Docker образа
docker build -t angry_little_fennec/frontend ./frontend

# Тегирование образа
docker tag angry_little_fennec/frontend angrylittlefennec/face_recognition_frontend:latest

# Отправка образа в репозиторий
docker push angrylittlefennec/face_recognition_frontend:latest

# Установка/обновление Helm чарта
helm upgrade --install frontend ./helm/frontend 