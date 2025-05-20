import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setSelectedCameraIndexRedux } from '../../actions';
import {
    fetchCameras,
    addCamera,
    deleteCamera,
    updateCamera,
    fetchCameraDetails,
    downloadCameraLogs,
    addStream,
    getAllStreams,
    deleteStream,
} from './Api';

const CamerasHandlers = (initialCameras = []) => {
    const dispatch = useDispatch();
    const [cameras, setCameras] = useState(initialCameras);
    const [cameraInfo, setCameraInfo] = useState(null);
    const [selectedCamera, setSelectedCamera] = useState('');
    const [selectedCameraIndex, setSelectedCameraIndex] = useState(null);
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

    const handleAddCamera = async () => {
        try {
            await addCamera(newCamera);
            resetNewCamera();
            handleFetchCameras();
        } catch (error) {
            handleError('Ошибка при добавлении камеры:', error);
        }
    };

    const handleUpdateCamera = async () => {
        if (selectedCameraIndex === null) {
            console.log('Камера не выбрана');
            return;
        }

        const cameraToUpdate = cameras[selectedCameraIndex];

        try {
            await updateCamera(cameraToUpdate.id, newCameraUpdate);
            setSelectedCamera('');
            setSelectedCameraIndex(null);
            resetNewCameraUpdate();
            handleFetchCameras();
        } catch (error) {
            handleError('Ошибка при обновлении камеры: ' + error);
        }
    };

    const handleDeleteCamera = async (cameraId) => {
        try {
            await deleteCamera(cameraId);
            // Обновляем состояние, удаляя камеру из списка
            setCameras(cameras.filter((camera) => camera.id !== cameraId));
            setSelectedCamera('');
            setSelectedCameraIndex(null);
            resetNewCamera();
        } catch (error) {
            handleError('Ошибка при удалении камеры: ' + error);
        }
    };

    const handleFetchCameras = async () => {
        try {
            const data = await fetchCameras();
            setCameras(data);
            console.log(data);
            // const streamsData = await getAllStreams();
            // console.log(`Стримы: ${streamsData}`);
        } catch (error) {
            handleError('Ошибка при получении информации о камерах:', error);
        } finally {
            setLoading(false);
        }
    };

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

    const handleDownloadCameraLogs = async (cameraId) => {
        try {
            const data = await downloadCameraLogs(cameraId);
            console.log(data);
            // При получении pdf файла в data
            // // Создаем URL для data
            // const url = window.URL.createObjectURL(data);

            // // Создаем временную ссылку для скачивания
            // const a = document.createElement('a');
            // a.href = url;
            // a.download = `camera_logs_${cameraId}.pdf`; // Имя файла для скачивания
            // document.body.appendChild(a);
            // a.click(); // Имитируем клик для скачивания
            // a.remove(); // Удаляем ссылку из документа
            // window.URL.revokeObjectURL(url); // Освобождаем память
        } catch (error) {
            handleError('Ошибка при получении логов камеры:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStream = async () => {
        try {
            await addStream(newCamera);
            resetNewStream();
            handleFetchStreams();
        } catch (error) {
            handleError('Ошибка при добавлении стрима:', error);
        }
    };

    const handleFetchStreams = async () => {
        try {
            const data = await getAllStreams();
            console.log(data);
        } catch (error) {
            handleError('Ошибка при получении стримов:', error);
        } finally {
            setLoading(false);
        }
    };

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
        }
    };

    const handleSelectStreamChange = (event) => {
        const selectedValue = event.target.value;
        setSelectedStream(selectedValue);
        const index = streams.findIndex(
            (stream) => stream.name === selectedValue
        );
        setSelectedStreamIndex(index);
    };

    const handleCameraClick = (index) => {
        const camera = cameras[index];
        setSelectedCamera(camera.name);
        setSelectedCameraIndex(index);
    };

    const handleSelectCamera = (index) => {
        dispatch(setSelectedCameraIndexRedux(index)); // Устанавливаем индекс в Redux
        const camera = cameras[index];
        setSelectedCamera(camera.name);
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
        handleDownloadCameraLogs,
        handleSelectChange,
        handleCameraClick,
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
    };
};

export default CamerasHandlers;
