import { useState } from 'react';

const CamerasHandlers = (initialCameras = []) => {
    const [cameraCount, setCameraCount] = useState(0);
    const [selectedCamera, setSelectedCamera] = useState('');
    const [selectedCameraIndex, setSelectedCameraIndex] = useState(null);
    const [cameras, setCameras] = useState(initialCameras);

    const handleAddCamera = async () => {
        const newCamera = `Камера ${cameraCount + 1}`;
        setCameraCount((prevCount) => prevCount + 1);
        setCameras((prevCameras) => [...prevCameras, newCamera]);
    };

    const handleSelectChange = (event) => {
        setSelectedCamera(event.target.value);
        setSelectedCameraIndex(cameras.indexOf(event.target.value));
    };

    const handleCameraClick = (index) => {
        setSelectedCamera(cameras[index]);
        setSelectedCameraIndex(index);
    };

    /*
    const [newCamera, setNewCamera] = useState({
        name: '',
        url: '',
        description: '',
        is_active: true,
    });

    useEffect(() => {
        loadCameras(); // Получаем список камер при первом рендере
    }, [loadCameras]);

    const handleAddCamera = async () => {
        try {
            await addCamera(newCamera);
            loadCameras();
            resetNewCamera();
        } catch (error) {
            handleError('Ошибка при добавлении камеры:', error);
        }
    };

    const handleFetchCameraDetails = async (cameraId) => {
        try {
            const data = await fetchCameraDetails(cameraId);
            console.log(data);
        } catch (error) {
            handleError('Ошибка при получении информации о камере:', error);
        }
    };

    const loadCameras = useCallback(async () => {
        try {
            const data = await fetchCameras();
            setCameras(data);
        } catch (error) {
            handleError('Ошибка при получении камер:', error);
        }
    }, []);

    const resetNewCamera = () => {
        setNewCamera({
            name: '',
            url: '',
            description: '',
            is_active: true,
        });
    };

        const handleError = (error) => {
        console.error(error);
    };
    */

    return {
        cameraCount,
        selectedCamera,
        selectedCameraIndex,
        cameras,
        handleAddCamera,
        handleSelectChange,
        handleCameraClick,
    };
};

export default CamerasHandlers;
