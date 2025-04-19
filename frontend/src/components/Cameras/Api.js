import { SERVER_URL } from '../../config';

export const fetchCameras = async () => {
    const response = await fetch(`${SERVER_URL}cameras/`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
};

export const addCamera = async (newCamera) => {
    const response = await fetch(`${SERVER_URL}cameras/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCamera),
    });
    if (!response.ok) {
        throw new Error(`Ошибка при добавлении камеры: ${response.status}`);
    }
    return response.json();
};

export const deleteCamera = async (cameraId) => {
    const response = await fetch(`${SERVER_URL}cameras/${cameraId}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error(`Ошибка при удалении камеры: ${response.status}`);
    }
    return response.json();
};

export const updateCamera = async (cameraId, updatedCameraData) => {
    const response = await fetch(`${SERVER_URL}cameras/${cameraId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCameraData),
    });
    if (!response.ok) {
        throw new Error('Ошибка при обновлении камеры: ' + response.statusText);
    }
    return await response.json();
};

export const fetchCameraDetails = async (cameraId) => {
    const response = await fetch(`${SERVER_URL}cameras/${cameraId}`);
    if (!response.ok) {
        throw new Error(
            `Ошибка при получении информации о камере: ${response.status}`
        );
    }
    return response.json();
};

export const downloadCameraLogs = async (cameraId) => {
    const response = await fetch(
        `${SERVER_URL}cameras/camera/${cameraId}/log/download`
    );
    if (!response.ok) {
        throw new Error(
            `Ошибка при получении логов камеры: ${response.status}`
        );
    }
    return response.json();
};
