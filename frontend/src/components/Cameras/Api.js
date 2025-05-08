import { SERVER_URL } from '../../config';

export const loginUser = async (user) => {
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('username', user.username);
    params.append('password', user.password);

    const response = await fetch(`${SERVER_URL}auth/token`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });

    if (!response.ok) {
        throw new Error(`Ошибка авторизации: ${response.status}`);
    }
    return response.json();
};

export const registerUser = async (user) => {
    console.log(JSON.stringify(user));
    const response = await fetch(`${SERVER_URL}auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
    });

    if (!response.ok) {
        throw new Error(`Ошибка регистрации: ${response.status}`);
    }
    return response.json();
};

export const fetchCameras = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${SERVER_URL}cameras/`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error(
            `Ошибка при получении списка камер: ${response.status}`
        );
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

export const fetchStream = async (cameraId) => {
    const response = await fetch(`${SERVER_URL}stream/${cameraId}`);
    if (!response.ok) {
        throw new Error(
            `Ошибка при получении видео с камеры ${cameraId}: ${response.status}`
        );
    }
    return response.json();
};

export const fetchPersons = async () => {
    const response = await fetch(`${SERVER_URL}persons/`);
    if (!response.ok) {
        throw new Error(
            `Ошибка при получении списка сотрудников: ${response.status}`
        );
    }
    return response.json();
};

export const addPerson = async (newPerson) => {
    const response = await fetch(`${SERVER_URL}persons/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPerson),
    });
    if (!response.ok) {
        throw new Error(`Ошибка при добавлении сотрудника: ${response.status}`);
    }
    return response.json();
};

export const addFace = async (personId, newFace) => {
    const response = await fetch(`${SERVER_URL}faces/upload/${personId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFace),
    });
    if (!response.ok) {
        throw new Error(`Ошибка при добавлении лиц: ${response.status}`);
    }
    return response.json();
};
