import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import CamerasContainer from './CamerasContainer';
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

function CamerasPage() {
    const [currentPage, setCurrentPage] = useState(0);
    const [camerasPerPage, setCamerasPerPage] = useState(4);
    const [camerasLocation, setCamerasLocation] = useState('second');

    const selectedCameraIndex = useSelector(
        (state) => state.selectedCameraIndex
    );

    const {
        goToProfileHandler,
        goToSettingsHandler,
        goToReportsHandler,
        goToStaffHandler,
        logoutHandler,
    } = NavigationHandlers();

    const {
        selectedCamera,
        cameras,
        loading,
        error,
        isModalSettingsOpen,
        isModalLogsOpen,
        openModalLogs,
        openModalSettings,
        closeModalLogs,
        closeModalSettings,
        handleSelectCamera,
        handleFetchCameras,
        handleSelectChange,
        setSelectedCamera,
    } = CamerasHandlers();

    useEffect(() => {
        if (selectedCameraIndex !== null) {
            const camera = cameras[selectedCameraIndex];
            if (camera) {
                setSelectedCamera(camera.name);
            }
        }
    }, [selectedCameraIndex, cameras, setSelectedCamera]);

    const pagesCount = Math.ceil(cameras.length / camerasPerPage) - 1;

    const handleNextPage = () => {
        if (currentPage < pagesCount) {
            setCurrentPage((prevPage) => prevPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 0) {
            setCurrentPage((prevPage) => prevPage - 1);
        }
    };

    const startIndex = currentPage * camerasPerPage;
    const endIndex = startIndex + camerasPerPage;
    const currentCameras = cameras.slice(startIndex, endIndex);

    const firstCameraLocationType = () => {
        setCamerasLocation('first');
        setCamerasPerPage(1);
    };
    const secondCameraLocationType = () => {
        setCamerasLocation('second');
        setCamerasPerPage(4);
    };
    const thirdCameraLocationType = () => {
        setCamerasLocation('third');
        setCamerasPerPage(6);
    };
    const fourthCameraLocationType = () => {
        setCamerasLocation('fourth');
        setCamerasPerPage(9);
    };

    /*
    useEffect(() => {
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
        <div className="page-container cameras-page-container">
            <div className="main-content margin-right-250 margin-bottom-50 white-text">
                <CamerasContainer
                    currentCameras={currentCameras}
                    camerasLocation={camerasLocation}
                    startIndex={startIndex}
                />
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
                        iconSrc="/icons/staff-icon-white.png"
                        altText="Сотрудники"
                        onClick={goToStaffHandler}
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
                    cameras={cameras}
                />

                <CameraLogsWindow
                    isOpen={isModalLogsOpen}
                    onClose={closeModalLogs}
                />
            </div>

            <div className="right-menu white-text">
                <div className="top-menu-part">
                    <p>Настройки просмотра:</p>
                    <Dropdown children={modelOptions} text="Выбор модели" />
                    <Dropdown children={trackingOptions} text="Виды трекинга" />
                    <Dropdown children={staffOptions} text="Выбор сотрудника" />
                    <div>
                        <button
                            onClick={handleFetchCameras}
                            className="right-menu-button"
                        >
                            Обновить камеры
                        </button>
                        <select
                            value={selectedCamera}
                            onChange={handleSelectChange}
                        >
                            <option value="" disabled>
                                Выберите камеру
                            </option>
                            {cameras.map((camera, index) => (
                                <option key={index} value={camera.name}>
                                    {camera.name}
                                </option>
                            ))}
                        </select>
                        {selectedCameraIndex !== null && (
                            <Link to={`/cameras/${selectedCameraIndex}`}>
                                <button
                                    onClick={() =>
                                        handleSelectCamera(selectedCameraIndex)
                                    }
                                    className="right-menu-button"
                                >
                                    Перейти к камере: {selectedCamera}
                                </button>
                            </Link>
                        )}
                    </div>
                </div>

                <div className="change-page-menu">
                    <IconButton
                        onClick={handlePrevPage}
                        iconSrc="/icons/left-arrows-icon.png"
                        altText="Предыдущая страница"
                        className="right-icon-button"
                    />
                    <p>
                        Страница {currentPage + 1}/{pagesCount + 1}
                    </p>
                    <IconButton
                        onClick={handleNextPage}
                        iconSrc="/icons/right-arrows-icon.png"
                        altText="Следующая страница"
                        className="right-icon-button"
                    />
                </div>
            </div>

            <div className="bottom-menu">
                <div className="bottom-menu-left-buttons">
                    <IconButton
                        onClick={firstCameraLocationType}
                        iconSrc="/icons/format-icon-1-white.png"
                        altText="Формат 1"
                        className="bottom-icon-button"
                    />
                    <IconButton
                        onClick={secondCameraLocationType}
                        iconSrc="/icons/format-icon-2-white.png"
                        altText="Формат 2"
                        className="bottom-icon-button"
                    />
                    <IconButton
                        onClick={thirdCameraLocationType}
                        iconSrc="/icons/format-icon-3-white.png"
                        altText="Формат 3"
                        className="bottom-icon-button"
                    />
                    <IconButton
                        onClick={fourthCameraLocationType}
                        iconSrc="/icons/format-icon-4-white.png"
                        altText="Формат 4"
                        className="bottom-icon-button"
                    />
                </div>

                <div className="bottom-menu-right-buttons">
                    {selectedCameraIndex + 1 && (
                        <ButtonWithTooltip
                            className="bottom-icon-button"
                            iconSrc="/icons/files-icon-white.png"
                            altText="Просмотр логов"
                            onClick={openModalLogs}
                        />
                    )}
                    {selectedCameraIndex + 1 && (
                        <Link to={`/cameras/${selectedCameraIndex}`}>
                            <ButtonWithTooltip
                                className="bottom-icon-button"
                                iconSrc="/icons/camera-icon-white.png"
                                altText="Перейти к камере"
                                onClick={() =>
                                    handleSelectCamera(selectedCameraIndex)
                                }
                            />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CamerasPage;
