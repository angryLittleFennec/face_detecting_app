import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCameras, addCamera, fetchCameraDetails } from './Api';
import { videoPlayerHandler } from './CameraInfo';
import Dropdown from '../UI/Dropdown';
import modelOptions from './ModelOptions';
import trackingOptions from './TrackingOptions';
import staffOptions from './StaffOptions';
import './CamerasPage.css';

function CamerasPage({ onLogout }) {
    const [cameras, setCameras] = useState([]);
    const [newCamera, setNewCamera] = useState({
        name: '',
        url: '',
        description: '',
        is_active: true,
    });

    const navigate = useNavigate();

    const logoutHandler = () => {
        onLogout();
        navigate('/');
    };

    const goToProfileHandler = () => {
        navigate('/profile');
    };

    const completedGoal = () => {
        alert('Внимание! Цель достигнута!');
    };

    const handleError = (error) => {
        console.error(error);
    };

    const resetNewCamera = () => {
        setNewCamera({
            name: '',
            url: '',
            description: '',
            is_active: true,
        });
    };

    const loadCameras = useCallback(async () => {
        try {
            const data = await fetchCameras();
            setCameras(data);
        } catch (error) {
            handleError('Ошибка при получении камер:', error);
        }
    }, []);

    const handleAddCamera = async () => {
        try {
            await addCamera(newCamera);
            loadCameras();
            resetNewCamera();
        } catch (error) {
            handleError('Ошибка при добавлении камеры:', error);
        }
    };

    const handleFetchCameraDetails = async (cameraId) => {
        try {
            const data = await fetchCameraDetails(cameraId);
            console.log(data);
        } catch (error) {
            handleError('Ошибка при получении информации о камере:', error);
        }
    };

    useEffect(() => {
        loadCameras(); // Получаем список камер при первом рендере
    }, [loadCameras]);

    return (
        <div>
            <h1>CamerasPage</h1>
            <div className="menu">
                <button onClick={goToProfileHandler}>Профиль</button>
                <p>Выберите видео для воспроизведения:</p>
                <Dropdown children={modelOptions} />
                <Dropdown children={trackingOptions} />
                <Dropdown children={staffOptions} />
                <button onClick={completedGoal}>Цель выполнена</button>
                <button className="logout-button" onClick={logoutHandler}>
                    Выход
                </button>
            </div>

            <div className="main-content">
                <h2>Добавить новую камеру:</h2>
                <input
                    type="text"
                    placeholder="Название камеры"
                    value={newCamera.name}
                    onChange={(e) =>
                        setNewCamera({ ...newCamera, name: e.target.value })
                    }
                />
                <input
                    type="text"
                    placeholder="URL видео"
                    value={newCamera.url}
                    onChange={(e) =>
                        setNewCamera({ ...newCamera, url: e.target.value })
                    }
                />
                <input
                    type="text"
                    placeholder="Описание"
                    value={newCamera.description}
                    onChange={(e) =>
                        setNewCamera({
                            ...newCamera,
                            description: e.target.value,
                        })
                    }
                />
                <label>
                    Активна:
                    <input
                        type="checkbox"
                        checked={newCamera.is_active}
                        onChange={(e) =>
                            setNewCamera({
                                ...newCamera,
                                is_active: e.target.checked,
                            })
                        }
                    />
                </label>
                <button onClick={handleAddCamera}>Добавить камеру</button>
                <br />
                <ul>
                    {cameras.map((camera) => (
                        <li
                            key={camera.id}
                            onClick={() => handleFetchCameraDetails(camera.id)}
                        >
                            {camera.name} (ID: {camera.id})
                            <br />
                            <button
                                onClick={() => videoPlayerHandler(camera.id)}
                            >
                                Посмотреть информацию о камере
                            </button>
                            <div id="camera-info"></div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default CamerasPage;
