import { SERVER_URL } from '../../config';

export const videoPlayerHandler = async (cameraId) => {
    try {
        const response = await fetch(`${SERVER_URL}cameras/${cameraId}`);
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Ошибка при получении информации о камере:', error);
    }
};

export const downloadCameraLogsHandler = async (cameraId) => {
    try {
        const response = await fetch(
            `${SERVER_URL}cameras/camera/${cameraId}/log/download`
        );
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Ошибка при получении информации о камере:', error);
    }
};
