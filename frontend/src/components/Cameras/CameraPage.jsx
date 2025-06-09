// Страница отдельной камеры
import { useParams } from 'react-router';
import { useRef, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import CamerasHandlers from './CamerasHandlers';
import CameraLogsWindow from './CameraLogsWindow';
import HlsPlayer from './HlsPlayer';
import DataHandlers from '../DataPages/DataHandlers';
import NavigationHandlers from '../GeneralComponents/NavigationHandlers';
import Dropdown from '../UI/Dropdown';
import ButtonWithTooltip from '../UI/ButtonWithTooltip';
import trackingOptions from './TrackingOptions';
import './CameraPage.css';

function CameraPage() {
    const { goToCamerasHandler, logoutHandler } = NavigationHandlers();
    const { id } = useParams();
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawingEnabled, setDrawingEnabled] = useState(false);
    const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
    const [endPoint, setEndPoint] = useState({ x: 0, y: 0 });
    const selectedCameraIndex = useSelector(
        (state) => state.selectedCameraIndex
    );

    const {
        cameras,
        streams,
        cameraInfo,
        loading,
        error,
        isModalLogsOpen,
        openModalLogs,
        closeModalLogs,
        handleFetchCameras,
        handleFetchCameraDetails,
    } = CamerasHandlers();

    const {
        persons,
        selectedPerson,
        selectedModel,
        handleFetchPersons,
        handleStaffDropdownSelectChange,
        handleModelSelectChange,
        handleDownloadCameraLogs,
        getStreamId,
        getStreamUrl,
    } = DataHandlers();

    const handleMouseDown = (e) => {
        if (!drawingEnabled) return;
        setIsDrawing(true);
        const rect = canvasRef.current.getBoundingClientRect();
        setStartPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleMouseMove = (e) => {
        if (!isDrawing) return;
        const rect = canvasRef.current.getBoundingClientRect();
        setEndPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleMouseUp = () => {
        if (!drawingEnabled) return;
        setIsDrawing(false);
        // Здесь можно сохранить координаты зоны для дальнейшей обработки
        console.log('Selected area:', { startPoint, endPoint });
    };

    // Отрисовка выделенной области
    useEffect(() => {
        if (isDrawing) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height
            );
            ctx.strokeStyle = 'red';
            ctx.strokeRect(
                startPoint.x,
                startPoint.y,
                endPoint.x - startPoint.x,
                endPoint.y - startPoint.y
            );
        }
    }, [isDrawing, startPoint, endPoint]);

    // Функция для переключения режима рисования
    const toggleDrawingMode = () => {
        setDrawingEnabled((prev) => !prev);
        if (drawingEnabled) {
            // Если мы выключаем режим рисования, сбрасываем состояние
            setIsDrawing(false);
            setStartPoint({ x: 0, y: 0 });
            setEndPoint({ x: 0, y: 0 });
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height
            ); // Очищаем канвас при выключении
        }
    };

    // Получение списка камер перед загрузкой страницы
    if (loading) {
        handleFetchCameras();
        handleFetchPersons();
        return <h2>Загрузка...</h2>;
    }

    if (error) {
        return <h2>Ошибка: {error}</h2>;
    }

    return (
        <div className="page-container">
            <div className="main-content margin-right-600 margin-bottom-250 white-text">
                {console.log(selectedCameraIndex)}
                {cameras.length > 0 ? (
                    <div className="camera-container">
                        <h1>{cameras[id].name}</h1>
                        <div className="solo-camera">
                            <HlsPlayer
                                url={getStreamUrl(cameras[id].id, streams)}
                            />
                            {drawingEnabled && (
                                <canvas
                                    ref={canvasRef}
                                    width={1280}
                                    height={720}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                    }}
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                />
                            )}
                        </div>
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
                    {selectedCameraIndex != null && (
                        <ButtonWithTooltip
                            className="icon-button margin-top-10"
                            iconSrc="/icons/files-icon-white.png"
                            altText="Просмотр логов"
                            onClick={openModalLogs}
                        />
                    )}
                </div>
                <div className="bottom-menu-part">
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/exit-icon-white.png"
                        altText="Выход"
                        onClick={logoutHandler}
                    />
                </div>
                <CameraLogsWindow
                    isOpen={isModalLogsOpen}
                    onClose={closeModalLogs}
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
                    onClick={() =>
                        handleDownloadCameraLogs(
                            getStreamId(cameras[id].id, streams)
                        )
                    }
                >
                    Скачать логи камеры
                </button>
                <button onClick={toggleDrawingMode}>
                    {drawingEnabled
                        ? 'Отключить рисование'
                        : 'Включить рисование'}
                </button>
            </div>
            <div className="filters white-text">
                <Dropdown
                    children={trackingOptions}
                    selectedValue={selectedModel}
                    onChange={handleModelSelectChange}
                    text="Виды трекинга"
                />
                <Dropdown
                    children={persons}
                    selectedValue={selectedPerson}
                    onChange={handleStaffDropdownSelectChange}
                    text="Выбор сотрудника"
                />
            </div>
            <div className="faces-feed white-text">
                <h2>Лента выявленных лиц</h2>
                <div className="images-container"></div>
            </div>
        </div>
    );
}

export default CameraPage;
