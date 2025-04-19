import { useState, useEffect } from 'react';
import CamerasHandlers from '../CamerasHandlers';
import CamerasInputInfo from './CamerasInputInfo';
import NavigationHandlers from '../../GeneralComponents/NavigationHandlers';
import ButtonWithTooltip from '../../UI/ButtonWithTooltip';
import './CamerasSettingsPage.css';

function CamerasSettingPage({ onLogout }) {
    const {
        goToCamerasHandler,
        logoutHandler,
        goToNotificationSettingsHandler,
        goToAdditionalSettingsHandler,
    } = NavigationHandlers(onLogout);

    const [detectionThreshold, setDetectionThreshold] = useState(0.7);
    const [recognitionThreshold, setRecognitionThreshold] = useState(0.8);
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const {
        selectedCamera,
        selectedCameraIndex,
        cameras,
        loading,
        error,
        handleAddCamera,
        handleUpdateCamera,
        handleDeleteCamera,
        handleFetchCameras,
        handleSelectChange,
    } = CamerasHandlers();

    const handleAuthenticate = () => {
        setIsAuthenticated(true); // Пока не работает аутентификация
        // Логика аутентификации
        /*if (password === 'your_password') {
            setIsAuthenticated(true);
        } else {
            alert('Неверный пароль');
        }*/
    };

    const handleSaveSettings = () => {
        // Сохранение настроек (например, в локальном хранилище или на сервере)
        console.log('Настройки сохранены:', {
            detectionThreshold,
            recognitionThreshold,
        });
    };

    useEffect(() => {
        handleFetchCameras();
    }, []);

    if (loading) {
        return <h2>Загрузка...</h2>;
    }

    if (error) {
        return <h2>Ошибка: {error}</h2>;
    }

    return (
        <div className="page-container">
            <div className="main-content">
                <div className="settings-page-container">
                    <div className="choose-settings-container">
                        <button className="selected-button">Камеры</button>
                        <br />
                        <button
                            className="choose-settings-button"
                            onClick={goToNotificationSettingsHandler}
                        >
                            Уведомления
                        </button>
                        <br />
                        <button
                            className="choose-settings-button"
                            onClick={goToAdditionalSettingsHandler}
                        >
                            Дополнительно
                        </button>
                    </div>
                    <div className="settings-container">
                        <h1>Камеры</h1>
                        {!isAuthenticated ? (
                            <div className="cameras-settings-container">
                                <h3>
                                    Доступ к настройкам камер осуществляется по
                                    паролю
                                </h3>
                                <input
                                    className="text-input"
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="Введите пароль"
                                />
                                <button onClick={handleAuthenticate}>
                                    Войти
                                </button>
                            </div>
                        ) : (
                            <div className="cameras-settings-container">
                                <div>
                                    <h3>Добавление камер</h3>
                                    <CamerasInputInfo />
                                    <button onClick={handleAddCamera}>
                                        Добавить камеру
                                    </button>
                                </div>
                                <div>
                                    <h3>Изменение камер</h3>
                                    <div className="cameras-container">
                                        <div className="text-align-left">
                                            <select
                                                value={selectedCamera}
                                                onChange={handleSelectChange}
                                            >
                                                <option value="" disabled>
                                                    Выберите камеру
                                                </option>
                                                {cameras.map(
                                                    (camera, index) => (
                                                        <option
                                                            key={index}
                                                            value={camera.name}
                                                        >
                                                            {camera.name}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>
                                        <CamerasInputInfo />
                                        {selectedCameraIndex !== null && (
                                            <div>
                                                <button
                                                    onClick={handleUpdateCamera}
                                                >
                                                    Обновить Камеру
                                                </button>
                                                <br />
                                                <button
                                                    className="delete-button"
                                                    onClick={() =>
                                                        handleDeleteCamera(
                                                            cameras[
                                                                selectedCameraIndex
                                                            ].id
                                                        )
                                                    }
                                                >
                                                    Удалить камеру
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h3>Настройка порогов</h3>
                                    <div className="text-align-left">
                                        <label>
                                            Порог уверенности для детекции лиц:
                                            <input
                                                className="number-input"
                                                type="number"
                                                min="0"
                                                max="1"
                                                step="0.01"
                                                value={detectionThreshold}
                                                onChange={(e) =>
                                                    setDetectionThreshold(
                                                        parseFloat(
                                                            e.target.value
                                                        )
                                                    )
                                                }
                                            />
                                        </label>
                                    </div>
                                    <div className="text-align-left">
                                        <label>
                                            Порог уверенности для распознавания
                                            лиц:
                                            <input
                                                className="number-input"
                                                type="number"
                                                min="0"
                                                max="1"
                                                step="0.01"
                                                value={recognitionThreshold}
                                                onChange={(e) =>
                                                    setRecognitionThreshold(
                                                        parseFloat(
                                                            e.target.value
                                                        )
                                                    )
                                                }
                                            />
                                        </label>
                                    </div>
                                    <button onClick={handleSaveSettings}>
                                        Сохранить настройки
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="left-menu">
                <div className="top-menu-part">
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/back-icon-white.png"
                        altText="Назад"
                        onClick={goToCamerasHandler}
                    />
                </div>
                <div className="bottom-menu-part">
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/exit-icon-white.png"
                        altText="Выход"
                        onClick={logoutHandler}
                    />
                </div>
            </div>
        </div>
    );
}

export default CamerasSettingPage;
