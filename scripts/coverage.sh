#!/bin/bash

# Запуск тестов с проверкой покрытия
echo "Запуск тестов с проверкой покрытия..."
pytest --cov=app --cov-report=term-missing

# Создание HTML отчета
echo "Создание HTML отчета..."
pytest --cov=app --cov-report=html

echo "Отчет о покрытии создан в директории htmlcov/"
echo "Откройте htmlcov/index.html в браузере для просмотра" 