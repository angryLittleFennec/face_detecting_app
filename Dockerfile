FROM ubuntu:24.04

WORKDIR /app

RUN apt-get update && apt-get install -y curl ca-certificates cmake python3-pip

# Install kubectl
ARG KUBECTL_VERSION=1.30.0
RUN curl -LO "https://dl.k8s.io/release/v${KUBECTL_VERSION}/bin/linux/amd64/kubectl" && \
    chmod +x kubectl && \
    mv kubectl /usr/local/bin/

# Install Helm
ARG HELM_VERSION=3.14.0
RUN curl -LO "https://get.helm.sh/helm-v${HELM_VERSION}-linux-amd64.tar.gz" && \
    tar -zxvf helm-v${HELM_VERSION}-linux-amd64.tar.gz && \
    mv linux-amd64/helm /usr/local/bin/helm && \
    rm -rf linux-amd64 helm-v${HELM_VERSION}-linux-amd64.tar.gz

# Verify installations
RUN kubectl version --client=true && helm version

EXPOSE 8000

ENV PYTHONPATH=/app

COPY ml_models ml_models



COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt --break-system-packages

COPY app app

# Копируем оба чарта
COPY helm/fastapi-app fastapi
COPY helm/stream-processor helm/stream-processor

RUN pip install --no-cache-dir pydantic[email] --break-system-packages

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]