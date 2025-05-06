FROM ubuntu:24.04

ARG DEBIAN_FRONTEND=noninteractive

# Install dependencies with cleanup
RUN apt-get update && apt-get install -y \
    build-essential cmake git pkg-config \
    python3-dev python3-pip python3-numpy \
    libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev \
    gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly \
    libavcodec-dev libavformat-dev libswscale-dev libavutil-dev \
    ffmpeg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Build OpenCV with memory-conscious settings
WORKDIR /opencv
RUN git clone --depth 1 --branch 4.8.1 https://github.com/opencv/opencv.git && \
    git clone --depth 1 --branch 4.8.1 https://github.com/opencv/opencv_contrib.git

RUN mkdir build && cd build && \
    cmake \
    -D CMAKE_BUILD_TYPE=RELEASE \
    -D CMAKE_INSTALL_PREFIX=/usr/local \
    -D PYTHON3_EXECUTABLE=$(which python3) \
    -D PYTHON3_NUMPY_INCLUDE_DIRS=$(python3 -c "import numpy; print(numpy.get_include())") \
    -D OPENCV_EXTRA_MODULES_PATH=../opencv_contrib/modules \
    -D WITH_GSTREAMER=ON \
    -D WITH_FFMPEG=ON \
    -D BUILD_EXAMPLES=OFF \
    -D BUILD_TESTS=OFF \
    -D BUILD_PERF_TESTS=OFF \
    -D BUILD_opencv_python3=ON \
    ../opencv && \
    make -j2 && \
    make install && \
    rm -rf /opencv && \
    ldconfig

# Set Python path
ENV PYTHONPATH="/usr/local/lib/python3.12/dist-packages:${PYTHONPATH}"

# Verify OpenCV and Numpy installation
RUN python3 -c "import cv2; print(f'OpenCV version: {cv2.__version__}')" && \
    python3 -c "import numpy; print(f'Numpy version: {numpy.__version__}')"

RUN apt-get update && \
    apt-get install -y software-properties-common && \
    add-apt-repository universe && \
    apt-get update

RUN apt-get install -y gstreamer1.0-rtsp python3-pip python3-venv

COPY requirements.txt .

RUN pip install -r requirements.txt --break-system-packages

# Default command
CMD ["/bin/bash"]