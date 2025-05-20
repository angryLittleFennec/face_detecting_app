import { SERVER_URL } from '../../config';

// Функция для получения куки
function getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0)
            return c.substring(nameEQ.length, c.length);
    }
    return null;
}

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
    const token = getCookie('authToken');
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
    const token = getCookie('authToken');

    const response = await fetch(`${SERVER_URL}cameras/`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
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
    const token = getCookie('authToken');
    const response = await fetch(`${SERVER_URL}cameras/${cameraId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error(`Ошибка при удалении камеры: ${response.status}`);
    }
    return response.json();
};

export const updateCamera = async (cameraId, updatedCameraData) => {
    const token = getCookie('authToken');
    const response = await fetch(`${SERVER_URL}cameras/${cameraId}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
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
    const token = getCookie('authToken');
    const response = await fetch(`${SERVER_URL}cameras/${cameraId}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error(
            `Ошибка при получении информации о камере: ${response.status}`
        );
    }
    return response.json();
};

export const downloadCameraLogs = async (cameraId) => {
    const token = getCookie('authToken');
    const response = await fetch(
        `${SERVER_URL}cameras/camera/${cameraId}/log/download`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        }
    );
    if (!response.ok) {
        throw new Error(
            `Ошибка при получении логов камеры: ${response.status}`
        );
    }
    return response.json();
};

// // При получении в результате запроса pdf файла
// export const downloadCameraLogs = async (cameraId) => {
//     const token = getCookie('authToken');
//     const response = await fetch(
//         ${SERVER_URL}cameras/camera/${cameraId}/log/download,
//         {
//             method: 'GET',
//             headers: {
//                 Authorization: Bearer ${token},
//                 Accept: 'application/pdf',
//             },
//         }
//     );
//     if (!response.ok) {
//         throw new Error(`Ошибка при получении логов камеры: ${response.status}`);
//     }
//     return response.blob();
// };

export const addStream = async (newStream) => {
    const token = getCookie('authToken');
    const response = await fetch(`${SERVER_URL}kubernetes/stream-processor`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStream),
    });
    if (!response.ok) {
        throw new Error(
            `Ошибка при добавлении стрима ${newStream.name}: ${response.status}`
        );
    }
    return response.json();
};

export const getAllStreams = async () => {
    const token = getCookie('authToken');
    const response = await fetch(`${SERVER_URL}kubernetes/stream-processors`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error(`Ошибка при получении стримов: ${response.status}`);
    }
    return response.json();
};

export const getStream = async (cameraId) => {
    const token = getCookie('authToken');
    const response = await fetch(`${SERVER_URL}kubernetes/stream-processors`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error(
            `Ошибка при получении стрима ${cameraId}: ${response.status}`
        );
    }
    return response.json();
};

export const deleteStream = async (name) => {
    const token = getCookie('authToken');
    const response = await fetch(
        `${SERVER_URL}kubernetes/stream-processor/${name}`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        }
    );
    if (!response.ok) {
        throw new Error(
            `Ошибка при удалении стрима ${name}: ${response.status}`
        );
    }
};

export const fetchPersons = async () => {
    const token = getCookie('authToken');
    const response = await fetch(`${SERVER_URL}persons/`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error(
            `Ошибка при получении списка сотрудников: ${response.status}`
        );
    }
    return response.json();
};

export const addPerson = async (newPerson) => {
    const token = getCookie('authToken');
    const response = await fetch(`${SERVER_URL}persons/`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPerson),
    });
    if (!response.ok) {
        throw new Error(`Ошибка при добавлении сотрудника: ${response.status}`);
    }
    return response.json();
};

export const fetchPerson = async (personId) => {
    const token = getCookie('authToken');
    const response = await fetch(`${SERVER_URL}persons/${personId}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error(
            `Ошибка при получении данных о сотруднике: ${response.status}`
        );
    }
    return response.json();
};

export const deletePerson = async (personId) => {
    const token = getCookie('authToken');
    const response = await fetch(`${SERVER_URL}persons/${personId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error(`Ошибка при удалении данных: ${response.status}`);
    }
    return response.json();
};

export const updatePerson = async (personId, updatedPersonData) => {
    const token = getCookie('authToken');
    const response = await fetch(`${SERVER_URL}persons/${personId}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPersonData),
    });
    if (!response.ok) {
        throw new Error('Ошибка при обновлении данных: ' + response.statusText);
    }
    return await response.json();
};

export const fetchFaces = async () => {
    const token = getCookie('authToken');
    const response = await fetch(`${SERVER_URL}faces/`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error(`Ошибка при получении лиц: ${response.status}`);
    }
    return response.json();
};

export const addFace = async (personId, newFace) => {
    const token = getCookie('authToken');
    const response = await fetch(`${SERVER_URL}faces/upload/${personId}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'multipart/form-data',
        },
        body: newFace,
    });
    if (!response.ok) {
        throw new Error(`Ошибка при добавлении лиц: ${response.status}`);
    }
    return response.json();
};
