FROM debian:bookworm

ENV DEBIAN_FRONTEND=noninteractive
ENV LANG=C.UTF-8
ENV PYTHON_VERSION=3.10.17

# Base packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg netbase wget git mercurial openssh-client subversion procps \
    autoconf automake bzip2 default-libmysqlclient-dev dpkg-dev file g++ gcc imagemagick \
    libbz2-dev libc6-dev libcurl4-openssl-dev libdb-dev libevent-dev libffi-dev libgdbm-dev \
    libglib2.0-dev libgmp-dev libjpeg-dev libkrb5-dev liblzma-dev libmagickcore-dev libmagickwand-dev \
    libmaxminddb-dev libncurses5-dev libncursesw5-dev libpng-dev libpq-dev libreadline-dev \
    libsqlite3-dev libssl-dev libtool libwebp-dev libxml2-dev libxslt-dev libyaml-dev make patch unzip \
    xz-utils zlib1g-dev libbluetooth-dev tk-dev uuid-dev build-essential cmake pkg-config \
    libgtk-3-dev libavcodec-dev libavformat-dev libswscale-dev libgstreamer1.0-dev \
    libgstreamer-plugins-base1.0-dev gstreamer1.0-plugins-base gstreamer1.0-tools \
    libtiff-dev libopenexr-dev libwebp-dev python3-dev python3-numpy libglib2.0-0 libsm6 libxext6 libxrender1 \
    ffmpeg gstreamer1.0-plugins-good gstreamer1.0-libav \
    && rm -rf /var/lib/apt/lists/*

# Install Python from source
RUN wget -O python.tar.xz "https://www.python.org/ftp/python/${PYTHON_VERSION}/Python-${PYTHON_VERSION}.tar.xz" && \
    mkdir -p /usr/src/python && \
    tar -xJf python.tar.xz -C /usr/src/python --strip-components=1 && \
    rm python.tar.xz && \
    cd /usr/src/python && \
    ./configure --enable-optimizations --enable-shared --with-lto --with-ensurepip && \
    make -j"$(nproc)" && make altinstall && \
    cd / && rm -rf /usr/src/python

ENV PATH="/usr/local/bin:$PATH"
ENV PYTHONDONTWRITEBYTECODE=1

RUN echo "/usr/local/lib" > /etc/ld.so.conf.d/local.conf && ldconfig

# Python pip essentials
RUN python3.10 -m pip install --no-cache-dir --disable-pip-version-check --no-compile \
    setuptools==65.5.1 wheel numpy

# Link python3.10 to standard python commands
RUN for bin in idle pydoc python python-config pip; do \
      ln -s /usr/local/bin/${bin}3.10 /usr/local/bin/${bin}; \
    done

# OpenCV source
WORKDIR /opt
RUN git clone --depth 1 https://github.com/opencv/opencv.git && \
    git clone --depth 1 https://github.com/opencv/opencv_contrib.git

# OpenCV build
WORKDIR /opt/opencv/build
RUN cmake -D CMAKE_BUILD_TYPE=Release \
    -D CMAKE_INSTALL_PREFIX=/usr/local \
    -D OPENCV_EXTRA_MODULES_PATH=/opt/opencv_contrib/modules \
    -D WITH_FFMPEG=ON \
    -D WITH_GSTREAMER=ON \
    -D BUILD_TESTS=OFF \
    -D BUILD_PERF_TESTS=OFF \
    -D BUILD_EXAMPLES=OFF \
    -D BUILD_opencv_python3=ON \
    -D PYTHON3_EXECUTABLE=/usr/local/bin/python3.10 \
    -D PYTHON3_INCLUDE_DIR=/usr/local/include/python3.10 \
    -D PYTHON3_LIBRARY=/usr/local/lib/libpython3.10.so \
    -D PYTHON3_PACKAGES_PATH=/usr/local/lib/python3.10/site-packages \
    ..

RUN make -j"$(nproc)" && make install

# Confirm OpenCV Python module
RUN python3.10 -c "import cv2; print('OpenCV version:', cv2.__version__)"

# Set Python path explicitly
ENV PYTHONPATH="/usr/local/lib/python3.10/site-packages:$PYTHONPATH"

WORKDIR /app

RUN python3.10 -m pip install dlib

RUN python3.10 -m pip install ultralytics requests

RUN python3.10 -m pip install numpy

COPY ml_models ml_models

RUN apt-get update && apt-get install -y gstreamer1.0-plugins-base gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly gstreamer1.0-libav gstreamer1.0-rtsp

COPY read_frames.py .

CMD ["/bin/bash"]


