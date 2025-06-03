Развертывание самого кластера оставляем за рамками задачи

Поднимаем базу в кубере

helm install my-postgresql bitnami/postgresql -f helm/postgresql/custom-values.yaml \
  --namespace database \
  --create-namespace


Подключиться к базе

  kubectl port-forward svc/postgres-postgresql 5432:5432 & PGPASSWORD="secret" psql --host 127.0.0.1 -U admin -d surveillance_db -p 5432


деплоим ingress-nginx контроллер потом нужно подставить его ip в конфигурации фронтенда и бекенда

helm install ingress-nginx/ingress-nginx



Деплоим микросервисы в кубер через helm под новый кластер может понадобиться чуть поменять конфигурацию
sh deploy_app.sh
sh deploy_frontend.sh
sh deploy_logging.sh

helm install mediamtx helm/mediamtx.yaml

Для деплоя нужна node c gpu, если нужно поставить драйвера для видокарточек на node то

helm install gpu-operator nvidia/gpu-operator

образ можно запушить с помощью test/push_proccess_image_cuda.sh 

все пути образов можно поменять на свой репозиторий и соотвественно заменить в helm манифестах


http://84.252.134.89/ - внешний айпи для доступа в кубер

http://84.252.134.89/api/docs - ручки бекенда



