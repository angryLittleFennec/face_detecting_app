// Функции для взаимодействия с камерами
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setSelectedCameraIndexRedux } from '../../actions';
import {
    fetchCameras,
    addCamera,
    deleteCamera,
    updateCamera,
    fetchCameraDetails,
    addStream,
    getAllStreams,
    deleteStream,
} from './Api';
import DataHandlers from '../DataPages/DataHandlers';

const CamerasHandlers = (initialCameras = []) => {
    const dispatch = useDispatch();
    const [cameras, setCameras] = useState(initialCameras);
    const [cameraInfo, setCameraInfo] = useState(null);
    const [selectedCamera, setSelectedCamera] = useState('');
    const [selectedCameraIndex, setSelectedCameraIndex] = useState(null);
    const [selectedCameraId, setSelectedCameraId] = useState(null);
    const [isVideoVisible, setIsVideoVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newCamera, setNewCamera] = useState({
        name: '',
        url: '',
        description: '',
        is_active: false,
    });
    const [newCameraUpdate, setNewCameraUpdate] = useState({
        name: '',
        url: '',
        description: '',
        is_active: false,
    });
    const [isModalSettingsOpen, setIsModalSettingsOpen] = useState(false);
    const [isModalLogsOpen, setIsModalLogsOpen] = useState(false);
    const [streams, setStreams] = useState([]);
    const [selectedStream, setSelectedStream] = useState('');
    const [selectedStreamIndex, setSelectedStreamIndex] = useState(null);
    const [newStream, setNewStream] = useState({
        name: '',
        camera_id: null,
    });

    const { handleFetchCameraLogsList } = DataHandlers();

    const resetNewStream = () => {
        setNewStream({
            name: '',
            camera_id: null,
        });
    };

    const resetNewCamera = () => {
        setNewCamera({
            name: '',
            url: '',
            description: '',
            is_active: false,
        });
    };

    const resetNewCameraUpdate = () => {
        setNewCameraUpdate({
            name: '',
            url: '',
            description: '',
            is_active: false,
        });
    };

    const resetSelectedCamera = () => {
        setSelectedCamera('');
        setSelectedCameraIndex(null);
        setSelectedCameraId(null);
    };

    // Добавление камеры
    const handleAddCamera = async () => {
        try {
            await addCamera(newCamera);
            resetNewCamera();
            handleFetchCameras();
        } catch (error) {
            handleError('Ошибка при добавлении камеры:', error);
        }
    };

    // Обновление камеры
    const handleUpdateCamera = async () => {
        if (selectedCameraIndex === null) {
            console.log('Камера не выбрана');
            return;
        }

        const cameraToUpdate = cameras[selectedCameraIndex];

        try {
            await updateCamera(cameraToUpdate.id, newCameraUpdate);
            resetSelectedCamera();
            resetNewCameraUpdate();
            handleFetchCameras();
        } catch (error) {
            handleError('Ошибка при обновлении камеры: ' + error);
        }
    };

    // Удаление камеры
    const handleDeleteCamera = async (cameraId) => {
        try {
            await deleteCamera(cameraId);
            // Обновляем состояние, удаляя камеру из списка
            setCameras(cameras.filter((camera) => camera.id !== cameraId));
            resetSelectedCamera();
            resetNewCamera();
        } catch (error) {
            handleError('Ошибка при удалении камеры: ' + error);
        }
    };

    // Получение камер и стримов
    const handleFetchCameras = async () => {
        try {
            const data = await fetchCameras();
            setCameras(data);
            const streamsData = await getAllStreams();
            setStreams(streamsData.processors);
        } catch (error) {
            handleError('Ошибка при получении информации о камерах:', error);
        } finally {
            setLoading(false);
        }
    };

    // Получение инфы о выбранной камере
    const handleFetchCameraDetails = async (cameraId) => {
        try {
            const data = await fetchCameraDetails(cameraId);
            console.log(data);
            setCameraInfo(data);
            setIsVideoVisible(false);
        } catch (error) {
            handleError('Ошибка при получении информации о камере:', error);
        } finally {
            setLoading(false);
        }
    };

    // Создание стрима
    const handleAddStream = async () => {
        try {
            await addStream(newCamera);
            resetNewStream();
            handleFetchStreams();
        } catch (error) {
            handleError('Ошибка при добавлении стрима:', error);
        }
    };

    // Получение списка стримов
    const handleFetchStreams = async () => {
        try {
            const data = await getAllStreams();
            setStreams(data.processors);
        } catch (error) {
            handleError('Ошибка при получении стримов:', error);
        } finally {
            setLoading(false);
        }
    };

    // Удаление стрима
    const handleDeleteStream = async (streamId) => {
        try {
            await deleteStream(streamId);
            // Обновляем состояние, удаляя стрим из списка
            setStreams(
                streams.filter((stream) => stream.camera_id !== streamId)
            );
            setSelectedStream('');
            setSelectedStreamIndex(null);
            resetNewStream();
        } catch (error) {
            handleError('Ошибка при удалении стрима: ' + error);
        }
    };

    const toggleVideo = () => {
        setIsVideoVisible(!isVideoVisible); // Переключаем видимость видео
    };

    // Смена выбранной камеры (с помощью клика или выпадающего списка)
    const handleSelectChange = (event) => {
        const selectedValue = event.target.value;
        setSelectedCamera(selectedValue);
        const index = cameras.findIndex(
            (camera) => camera.name === selectedValue
        );
        setSelectedCameraIndex(index);
        dispatch(setSelectedCameraIndexRedux(index));
        const selected = cameras.find(
            (camera) => camera.name === selectedValue
        );
        if (selected) {
            setNewCameraUpdate({
                name: selected.name,
                url: selected.url,
                description: selected.description,
                is_active: selected.is_active,
            });
            setSelectedCameraId(selected.id);
        }
    };

    // Смена выбранного стрима
    const handleSelectStreamChange = (event) => {
        const selectedValue = event.target.value;
        setSelectedStream(selectedValue);
        const index = streams.findIndex(
            (stream) => stream.name === selectedValue
        );
        setSelectedStreamIndex(index);
    };

    // Для выбора камеры
    const handleSelectCamera = (index) => {
        dispatch(setSelectedCameraIndexRedux(index)); // Устанавливаем индекс в Redux
        const camera = cameras[index];
        setSelectedCamera(camera.name);
        handleFetchCameraLogsList(camera.id);
    };

    const handleError = (error) => {
        setError(error);
        console.error(error);
    };

    const openModalSettings = () => setIsModalSettingsOpen(true);
    const closeModalSettings = () => setIsModalSettingsOpen(false);

    const openModalLogs = () => setIsModalLogsOpen(true);
    const closeModalLogs = () => setIsModalLogsOpen(false);

    return {
        cameras,
        cameraInfo,
        newCamera,
        newCameraUpdate,
        selectedCamera,
        selectedCameraIndex,
        streams,
        newStream,
        selectedStream,
        selectedStreamIndex,
        isVideoVisible,
        loading,
        error,
        isModalSettingsOpen,
        isModalLogsOpen,
        selectedCameraId,
        setCameras,
        setNewCamera,
        setNewCameraUpdate,
        setLoading,
        setNewStream,
        setSelectedStream,
        handleAddCamera,
        handleUpdateCamera,
        handleDeleteCamera,
        handleSelectCamera,
        handleFetchCameras,
        handleFetchCameraDetails,
        handleSelectChange,
        handleError,
        toggleVideo,
        openModalSettings,
        closeModalSettings,
        openModalLogs,
        closeModalLogs,
        setSelectedCamera,
        handleFetchStreams,
        handleAddStream,
        handleDeleteStream,
        handleSelectStreamChange,
        resetSelectedCamera,
    };
};

export default CamerasHandlers;
