import { useState } from 'react';
//import { useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
//import { fetchCameras, addCamera, fetchCameraDetails } from './Api';
//import { videoPlayerHandler } from './CameraInfo';
import CamerasHandlers from './CamerasHandlers';
import CamerasStatusWindow from './CamerasStatusWindow';
import CameraLogsWindow from './CameraLogsWindow';
import NavigationHandlers from '../GeneralComponents/NavigationHandlers';
import Dropdown from '../UI/Dropdown';
import ButtonWithTooltip from '../UI/ButtonWithTooltip';
import IconButton from '../UI/IconButton';
import modelOptions from './ModelOptions';
import trackingOptions from './TrackingOptions';
import staffOptions from './StaffOptions';
import './CamerasPage.css';

function CamerasPage({ onLogout }) {
    const [isModalSettingsOpen, setIsModalSettingsOpen] = useState(false);
    const [isModalLogsOpen, setIsModalLogsOpen] = useState(false);

    const openModalSettings = () => setIsModalSettingsOpen(true);
    const closeModalSettings = () => setIsModalSettingsOpen(false);

    const openModalLogs = () => setIsModalLogsOpen(true);
    const closeModalLogs = () => setIsModalLogsOpen(false);

    const {
        goToProfileHandler,
        goToSettingsHandler,
        goToReportsHandler,
        goToDataHandler,
        logoutHandler,
    } = NavigationHandlers(onLogout);

    const {
        selectedCamera,
        selectedCameraIndex,
        cameras,
        handleAddCamera,
        handleSelectChange,
        handleCameraClick,
    } = CamerasHandlers();

    const completedGoal = () => {
        alert('Внимание! Цель достигнута!');
    };

    return (
        <div className="page-container">
            <div className="main-content margin-right-250 margin-bottom-50">
                <h2>Добавить новую камеру:</h2>
                <div className="cameras-container">
                    {cameras.map((camera, index) => (
                        <div
                            key={index}
                            className="camera"
                            onClick={() => handleCameraClick(index)}
                            style={{
                                border:
                                    selectedCameraIndex === index
                                        ? '2px solid blue'
                                        : 'none',
                            }}
                        >
                            {camera}
                        </div>
                    ))}
                    {selectedCameraIndex !== null && (
                        <Link to={`/cameras/${cameras[selectedCameraIndex]}`}>
                            <button className="select-button">
                                Выбрана камера: {cameras[selectedCameraIndex]}
                            </button>
                        </Link>
                    )}
                </div>
            </div>

            <div className="left-menu">
                <div className="top-menu-part">
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/profile-icon-white.png"
                        altText="Профиль"
                        onClick={goToProfileHandler}
                    />
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/cameras-status-icon-white.png"
                        altText="Статус камер"
                        onClick={openModalSettings}
                    />
                </div>

                <div className="bottom-menu-part">
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/settings-icon-white.png"
                        altText="Настройка камер"
                        onClick={goToSettingsHandler}
                    />
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/files-icon-white.png"
                        altText="Отчетность"
                        onClick={goToReportsHandler}
                    />
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/data-icon-white.png"
                        altText="Загрузка данных"
                        onClick={goToDataHandler}
                    />
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/exit-icon-white.png"
                        altText="Выход"
                        onClick={logoutHandler}
                    />
                </div>

                <CamerasStatusWindow
                    isOpen={isModalSettingsOpen}
                    onClose={closeModalSettings}
                />

                <CameraLogsWindow
                    isOpen={isModalLogsOpen}
                    onClose={closeModalLogs}
                />
            </div>

            <div className="right-menu">
                <div className="top-menu-part">
                    <p>Выберите видео для воспроизведения:</p>
                    <Dropdown children={modelOptions} text="Выбор модель" />
                    <Dropdown children={trackingOptions} text="Виды трекинга" />
                    <Dropdown children={staffOptions} text="Выбор сотрудника" />
                    <div>
                        <button onClick={handleAddCamera}>
                            Добавить камеру
                        </button>
                        <select
                            value={selectedCamera}
                            onChange={handleSelectChange}
                        >
                            <option value="" disabled>
                                Выберите камеру
                            </option>
                            {cameras.map((camera, index) => (
                                <option key={index} value={camera}>
                                    {camera}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bottom-menu">
                <div className="bottom-menu-left-buttons">
                    <IconButton
                        onClick={completedGoal}
                        iconSrc="/icons/format-icon-1-white.png"
                        altText="Формат 1"
                        className="bottom-icon-button"
                    />
                    <IconButton
                        onClick={completedGoal}
                        iconSrc="/icons/format-icon-2-white.png"
                        altText="Формат 2"
                        className="bottom-icon-button"
                    />
                    <IconButton
                        onClick={completedGoal}
                        iconSrc="/icons/format-icon-3-white.png"
                        altText="Формат 3"
                        className="bottom-icon-button"
                    />
                    <IconButton
                        onClick={completedGoal}
                        iconSrc="/icons/format-icon-4-white.png"
                        altText="Формат 4"
                        className="bottom-icon-button"
                    />
                </div>
                <div className="bottom-menu-right-buttons">
                    {selectedCamera && (
                        <ButtonWithTooltip
                            className="bottom-icon-button"
                            iconSrc="/icons/files-icon-white.png"
                            altText="Просмотр логов"
                            onClick={openModalLogs}
                        />
                    )}
                    {selectedCamera && (
                        <Link to={`/cameras/${cameras[selectedCameraIndex]}`}>
                            <ButtonWithTooltip
                                className="bottom-icon-button"
                                iconSrc="/icons/camera-icon-white.png"
                                altText="Перейти к камере"
                            />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CamerasPage;
