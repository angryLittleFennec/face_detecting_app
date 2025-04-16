sudo docker build -t angry_little_fennec/app .
sudo docker tag angry_little_fennec/app angrylittlefennec/surveillance_app:latest

sudo docker push angrylittlefennec/surveillance_app:latest

helm upgrade --install fastapi-app helm/fastapi-app