sudo docker build -t test_debian .
sudo docker tag test_debian angrylittlefennec/stream-processor:latest
sudo docker push angrylittlefennec/stream-processor:latest