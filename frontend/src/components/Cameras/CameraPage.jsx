//import { useEffect } from 'react';
//import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import CamerasHandlers from './CamerasHandlers';
import CameraSettingsWindow from './Settings/CameraSettingsWindow';
import NavigationHandlers from '../GeneralComponents/NavigationHandlers';
import Dropdown from '../UI/Dropdown';
import ButtonWithTooltip from '../UI/ButtonWithTooltip';
import modelOptions from './ModelOptions';
import trackingOptions from './TrackingOptions';
import staffOptions from './StaffOptions';
import './CameraPage.css';

function CameraPage() {
    const { goToCamerasHandler, logoutHandler } = NavigationHandlers();
    const { id } = useParams();
    // const selectedCameraIndex = useSelector(
    //     (state) => state.selectedCameraIndex
    // );

    const {
        cameras,
        cameraInfo,
        loading,
        error,
        isModalSettingsOpen,
        handleFetchCameras,
        handleFetchCameraDetails,
        handleDownloadCameraLogs,
        openModalSettings,
        closeModalSettings,
    } = CamerasHandlers();

    /*useEffect(() => {
        handleFetchCameras();
    }, [handleFetchCameras]);*/

    if (loading) {
        handleFetchCameras();
        return <h2>Загрузка...</h2>;
    }

    if (error) {
        return <h2>Ошибка: {error}</h2>;
    }

    return (
        <div className="page-container">
            <div className="main-content margin-right-600 margin-bottom-250 white-text">
                {cameras.length > 0 ? (
                    <div className="camera-container">
                        <h1>{cameras[id].name}</h1>
                        <video controls autoPlay loop>
                            <source
                                //src={cameras[id].url}
                                src={`${process.env.PUBLIC_URL}/videos/Meow.mp4`}
                                type="video/mp4"
                            />
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
                        onClick={openModalSettings}
                    />
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/exit-icon-white.png"
                        altText="Выход"
                        onClick={logoutHandler}
                    />
                </div>
                <CameraSettingsWindow
                    isOpen={isModalSettingsOpen}
                    onClose={closeModalSettings}
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
                <Dropdown children={modelOptions} text="Выбор модели" />
                <Dropdown children={trackingOptions} text="Виды трекинга" />
                <Dropdown children={staffOptions} text="Выбор сотрудника" />
                <Dropdown children={staffOptions} text="Признаки лица" />
                <Dropdown children={staffOptions} text="Другое" />
            </div>
            <div className="faces-feed white-text">
                <h2>Лента выявленных лиц</h2>
                <div className="images-container">
                    <img
                        src={`${process.env.PUBLIC_URL}/videos/человек.png`}
                        alt="Человек"
                    />
                    <img
                        src={`${process.env.PUBLIC_URL}/videos/кот.png`}
                        alt="Кот"
                    />
                </div>
            </div>
        </div>
    );
}

export default CameraPage;
