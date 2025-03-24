import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchCameras, addCamera, fetchCameraDetails } from './Api';
import { videoPlayerHandler } from './CameraInfo';
import Dropdown from '../UI/Dropdown';
import ButtonWithTooltip from '../UI/ButtonWithTooltip';
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

    const goToProfileHandler = () => {
        navigate('/profile');
    };

    const goToSettingsHandler = () => {
        navigate('/cameras/settings');
    };

    const goToReportsHandler = () => {
        navigate('/report');
    };

    const goToDataHandler = () => {
        navigate('/data');
    };

    const logoutHandler = () => {
        onLogout();
        navigate('/');
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

    const [cameraCount, setCameraCount] = useState(0);
    const [buttons, setButtons] = useState([]);

    const handleAddCamera = async () => {
        setCameraCount((prevCount) => prevCount + 1);
        setButtons((prevButtons) => [
            ...prevButtons,
            `Камера ${cameraCount + 1}`,
        ]);
    };

    /*const handleAddCamera = async () => {
        try {
            await addCamera(newCamera);
            loadCameras();
            resetNewCamera();
        } catch (error) {
            handleError('Ошибка при добавлении камеры:', error);
        }
    };*/

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
        <div className="page-container">
            <div className="main-content margin-right-250 margin-bottom-50">
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
                <div>
                    {buttons.map((buttonText, index) => (
                        <Link key={index} to={`/cameras/${index + 1}`}>
                            <button>{buttonText}</button>
                        </Link>
                    ))}
                </div>
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
            <div className="left-menu">
                <div className="top-menu-part">
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/profile-icon-white.png"
                        altText="Профиль"
                        tooltipText="Профиль"
                        onClick={goToProfileHandler}
                    />
                </div>
                <div className="bottom-menu-part">
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/settings-icon-white.png"
                        altText="Настройка камер"
                        tooltipText="Настройка камер"
                        onClick={goToSettingsHandler}
                    />
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/files-icon-white.png"
                        altText="Отчетность"
                        tooltipText="Отчетность"
                        onClick={goToReportsHandler}
                    />
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/data-icon-white.png"
                        altText="Загрузка данных"
                        tooltipText="Загрузка данных"
                        onClick={goToDataHandler}
                    />
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/exit-icon-white.png"
                        altText="Выход"
                        tooltipText="Выход"
                        onClick={logoutHandler}
                    />
                </div>
            </div>

            <div className="right-menu">
                <div className="top-menu-part">
                    <p>Выберите видео для воспроизведения:</p>
                    <Dropdown children={modelOptions} text="Выбор модель" />
                    <Dropdown children={trackingOptions} text="Виды трекинга" />
                    <Dropdown children={staffOptions} text="Выбор сотрудника" />
                    <button onClick={completedGoal}>Цель выполнена</button>
                </div>
            </div>

            <div className="bottom-menu">
                <button onClick={completedGoal} className="bottom-icon-button">
                    <img src="/icons/format-icon-1-white.png" alt="Формат 1" />
                </button>
                <button onClick={completedGoal} className="bottom-icon-button">
                    <img src="/icons/format-icon-2-white.png" alt="Формат 2" />
                </button>
                <button onClick={completedGoal} className="bottom-icon-button">
                    <img src="/icons/format-icon-3-white.png" alt="Формат 3" />
                </button>
                <button onClick={completedGoal} className="bottom-icon-button">
                    <img src="/icons/format-icon-4-white.png" alt="Формат 4" />
                </button>
            </div>
        </div>
    );
}

export default CamerasPage;
