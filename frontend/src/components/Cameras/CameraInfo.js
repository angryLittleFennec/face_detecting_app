import { SERVER_URL } from '../../config';

export const videoPlayerHandler = async (cameraId) => {
    try {
        const response = await fetch(`${SERVER_URL}/cameras/${cameraId}`);
        const data = await response.json();
        const cameraInfoDiv = document.getElementById('camera-info');
        cameraInfoDiv.innerHTML = `<h3>Информация о камере</h3>
            <p>ID: ${data.id}</p>
            <p>Название: ${data.name}</p>
            <p>Описание: ${data.description}</p>
            <p>Ссылка: ${data.url}</p>
            <p>Статус: ${data.is_active ? 'Активна' : 'Отключена'}</p>`;
    } catch (error) {
        console.error('Ошибка при получении информации о камере:', error);
    }
};
