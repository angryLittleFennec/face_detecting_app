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
        } catch (error) {
            handleError('Ошибка при получении логов камеры:', error);
        } finally {
            setLoading(false);
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
        const selected = cameras.find(
            (camera) => camera.name === selectedValue
        );
        setSelectedCameraIndex(index);
        if (selected) {
            setNewCameraUpdate({
                name: selected.name,
                url: selected.url,
                description: selected.description,
                is_active: selected.is_active,
            });
        }
    };

    const handleCameraClick = (index) => {
        const camera = cameras[index];
        setSelectedCamera(camera.name);
        setSelectedCameraIndex(index);
    };

    const handleSelectCamera = (index) => {
        dispatch(setSelectedCameraIndexRedux(index)); // Устанавливаем индекс в Redux
    };

    const handleError = (error) => {
        setError(error);
        console.error(error);
    };

    return {
        cameras,
        cameraInfo,
        newCamera,
        newCameraUpdate,
        selectedCamera,
        selectedCameraIndex,
        isVideoVisible,
        loading,
        error,
        setCameras,
        setNewCamera,
        setNewCameraUpdate,
        setLoading,
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
    };
};

export default CamerasHandlers;
