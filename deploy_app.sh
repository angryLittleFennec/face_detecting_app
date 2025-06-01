docker build -t angry_little_fennec/app .
docker tag angry_little_fennec/app angrylittlefennec/surveillance_app:latest

docker push angrylittlefennec/surveillance_app:latest

helm upgrade --install fastapi-app helm/fastapi-app