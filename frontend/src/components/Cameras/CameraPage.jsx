import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import CamerasHandlers from './CamerasHandlers';
import CameraSettingsWindow from './Settings/CameraSettingsWindow';
import NavigationHandlers from '../GeneralComponents/NavigationHandlers';
import Dropdown from '../UI/Dropdown';
import ButtonWithTooltip from '../UI/ButtonWithTooltip';
import modelOptions from './ModelOptions';
import trackingOptions from './TrackingOptions';
import staffOptions from './StaffOptions';
import './CameraPage.css';

function CameraPage({ onLogout }) {
    const { goToCamerasHandler, logoutHandler } = NavigationHandlers(onLogout);
    const { id } = useParams();
    const selectedCameraIndex = useSelector(
        (state) => state.selectedCameraIndex
    );
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const {
        cameras,
        cameraInfo,
        isVideoVisible,
        loading,
        error,
        handleFetchCameras,
        handleFetchCameraDetails,
        handleDownloadCameraLogs,
        toggleVideo,
    } = CamerasHandlers();

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
            <div className="main-content margin-right-600 margin-bottom-250 white-text">
                {cameras.length > 1 ? (
                    <div style={{ marginTop: '10px' }}>
                        {console.log(id)}
                        {console.log(selectedCameraIndex)}
                        <h1>{cameras[id].name}</h1>
                        <video width="400" controls autoPlay>
                            <source src={cameras[id].url} type="video/mp4" />
                            Ваш браузер не поддерживает видео.
                        </video>
                    </div>
                ) : (
                    <h1>Камера не найдена</h1>
                )}
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
                        iconSrc="/icons/settings-icon-white.png"
                        altText="Настройка камер"
                        onClick={openModal}
                    />
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/exit-icon-white.png"
                        altText="Выход"
                        onClick={logoutHandler}
                    />
                </div>
                <CameraSettingsWindow
                    isOpen={isModalOpen}
                    onClose={closeModal}
                />
            </div>
            <div className="results white-text">
                <h2>Результаты идентификации</h2>
                <button
                    onClick={() => handleFetchCameraDetails(cameras[id].id)}
                >
                    Получить информацию о камере
                </button>
                {cameraInfo && (
                    <div
                        id="camera-info"
                        style={{
                            border: '1px solid black',
                            padding: '10px',
                            marginTop: '10px',
                        }}
                    >
                        <h3>Информация о камере</h3>
                        <p>ID: {cameraInfo.id}</p>
                        <p>Название: {cameraInfo.name}</p>
                        <p>Описание: {cameraInfo.description}</p>
                        <p>Ссылка: {cameraInfo.url}</p>
                        <p>
                            Статус:{' '}
                            {cameraInfo.is_active ? 'Активна' : 'Отключена'}
                        </p>
                    </div>
                )}
                <button
                    onClick={() => handleDownloadCameraLogs(cameras[id].id)}
                >
                    Скачать логи камеры
                </button>
            </div>
            <div className="filters white-text">
                <Dropdown children={modelOptions} text="Выбор модель" />
                <Dropdown children={trackingOptions} text="Виды трекинга" />
                <Dropdown children={staffOptions} text="Выбор сотрудника" />
            </div>
            <div className="faces-feed white-text">
                <h2>Лента выявленных лиц</h2>
            </div>
        </div>
    );
}

export default CameraPage;
