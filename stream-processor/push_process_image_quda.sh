docker build -t stream-processor-cuda -f DockerFileCuda .
docker tag stream-processor-cuda cr.yandex/crpa91sr9tr2i9j9gpba/stream-processor-cuda:latest
docker push cr.yandex/crpa91sr9tr2i9j9gpba/stream-processor-cuda:latest
