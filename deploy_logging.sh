#!/bin/bash

# Сборка Docker образа
sudo docker build -t angry_little_fennec/logging -f Dockerfile.logging .

# Тегирование образа
sudo docker tag angry_little_fennec/logging angrylittlefennec/face_detection_logging:latest

# Отправка образа в репозиторий
sudo docker push angrylittlefennec/face_detection_logging:latest

# Деплой в Kubernetes через Helm
helm upgrade --install logging-service helm/logging-service 