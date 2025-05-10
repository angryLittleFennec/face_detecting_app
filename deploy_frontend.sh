#!/bin/bash

# Сборка Docker образа
sudo docker build -t angry_little_fennec/frontend ./frontend

# Тегирование образа
sudo docker tag angry_little_fennec/frontend angrylittlefennec/face_recognition_frontend:latest

# Отправка образа в репозиторий
sudo docker push angrylittlefennec/face_recognition_frontend:latest

# Установка/обновление Helm чарта
helm upgrade --install frontend ./helm/frontend 