import { SERVER_URL } from '../../config';

export const fetchCameras = async () => {
    const response = await fetch(`${SERVER_URL}/cameras/`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
};

export const addCamera = async (newCamera) => {
    const response = await fetch(`${SERVER_URL}/cameras/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCamera),
    });
    if (!response.ok) {
        throw new Error(response.statusText);
    }
    return response.json();
};

export const fetchCameraDetails = async (cameraId) => {
    const response = await fetch(`${SERVER_URL}/cameras/${cameraId}`);
    if (!response.ok) {
        throw new Error(
            `Ошибка при получении информации о камере: ${response.statusText}`
        );
    }
    return response.json();
};
