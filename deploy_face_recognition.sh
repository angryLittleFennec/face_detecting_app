sudo docker build -t face-recognition -f dockerFileDlib .
sudo docker tag face-recognition angrylittlefennec/face-recognition:latest

sudo docker push angrylittlefennec/face-recognition:latest

helm upgrade --install face-recognition helm/face_recognition