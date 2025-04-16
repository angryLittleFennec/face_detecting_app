Поднимаем базу в кубере

helm install my-postgresql bitnami/postgresql -f helm/postgresql/custom-values.yaml \
  --namespace database \
  --create-namespace


Подключиться к базе

  kubectl port-forward svc/postgres-postgresql 5432:5432 & PGPASSWORD="secret" psql --host 127.0.0.1 -U admin -d surveillance_db -p 5432


 Задеплоить основную аппку    

sudo sh deploy_app.sh

http://158.160.133.8/ - внешний айпи для доступа в кубер



