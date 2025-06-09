// Функции для взаимодействия с даннными
import { useState, useRef } from 'react';
import {
    fetchPersons,
    addPerson,
    addFace,
    updatePerson,
    deletePerson,
    downloadLogs,
    downloadCameraLogs,
    downloadPersonLogs,
    fetchLogsList,
    fetchCameraLogsList,
    fetchPersonLogsList,
    sendEmail,
} from '../Cameras/Api';

const DataHandlers = () => {
    const fileInputRef = useRef(null);
    const [persons, setPersons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newPerson, setNewPerson] = useState({ name: '' });
    const [newFace, setNewFace] = useState([]);
    const [isUploadWindowOpen, setIsUploadWindowOpen] = useState(false);
    const [isEditWindowOpen, setIsEditWindowOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState('');
    const [selectedPersonIndex, setSelectedPersonIndex] = useState(null);
    const [selectedPersonId, setSelectedPersonId] = useState(null);
    const [selectedModel, setSelectedModel] = useState('');
    const [files, setFiles] = useState([]);
    const [selectedLogIndex, setSelectedLogIndex] = useState('');
    const [isLogsFilterWindowOpen, setIsLogsFilterWindowOpen] = useState(false);

    // Сброс выбранного сотрудника (не буквально)
    const resetSelectedPerson = () => {
        setSelectedPerson('');
        setSelectedPersonIndex(null);
        setSelectedPersonId(null);
    };

    // Скачивание логов камер
    const handleDownloadLogs = async () => {
        try {
            const data = await downloadLogs();
            // Создаем URL для data
            const url = window.URL.createObjectURL(data);

            // Создаем временную ссылку для скачивания
            const a = document.createElement('a');
            a.href = url;
            a.download = `cameras_logs.pdf`; // Имя файла для скачивания
            document.body.appendChild(a);
            a.click(); // Имитируем клик для скачивания
            a.remove(); // Удаляем ссылку из документа
            window.URL.revokeObjectURL(url); // Освобождаем память
        } catch (error) {
            handleError('Ошибка при получении логов камеры:', error);
        } finally {
            setLoading(false);
        }
    };

    // Скачивание логов выбранной камеры, параметр = id стрима
    const handleDownloadCameraLogs = async (streamId) => {
        try {
            const data = await downloadCameraLogs(streamId);
            // Создаем URL для data
            const url = window.URL.createObjectURL(data);

            // Создаем временную ссылку для скачивания
            const a = document.createElement('a');
            a.href = url;
            a.download = `camera_${streamId}_logs.pdf`; // Имя файла для скачивания
            document.body.appendChild(a);
            a.click(); // Имитируем клик для скачивания
            a.remove(); // Удаляем ссылку из документа
            window.URL.revokeObjectURL(url); // Освобождаем память
        } catch (error) {
            handleError('Ошибка при получении логов камеры:', error);
        } finally {
            setLoading(false);
        }
    };

    // Скачивание логов выбранного сотрудника
    const handleDownloadPersonLogs = async (personId) => {
        try {
            const data = await downloadPersonLogs(personId);
            // Создаем URL для data
            const url = window.URL.createObjectURL(data);

            // Создаем временную ссылку для скачивания
            const a = document.createElement('a');
            a.href = url;
            a.download = `person_${personId}_logs.pdf`; // Имя файла для скачивания
            document.body.appendChild(a);
            a.click(); // Имитируем клик для скачивания
            a.remove(); // Удаляем ссылку из документа
            window.URL.revokeObjectURL(url); // Освобождаем память
        } catch (error) {
            handleError('Ошибка при получении логов камеры:', error);
        } finally {
            setLoading(false);
        }
    };

    // Получить список событий
    const handleFetchLogsList = async () => {
        try {
            const data = await fetchLogsList();
            setFiles(data);
        } catch (error) {
            handleError('Ошибка при получении логов камеры:', error);
        } finally {
            setLoading(false);
        }
    };

    // Получить список событий по выбранной камере, параметр = id стрима
    const handleFetchCameraLogsList = async (streamId) => {
        try {
            const data = await fetchCameraLogsList(streamId);
            setFiles(data);
        } catch (error) {
            handleError('Ошибка при получении логов камеры:', error);
        } finally {
            setLoading(false);
        }
    };

    // Получить список событий по выбранному сотруднику
    const handleFetchPersonLogsList = async (personId) => {
        try {
            const data = await fetchPersonLogsList(personId);
            setFiles(data);
        } catch (error) {
            handleError('Ошибка при получении логов камеры:', error);
        } finally {
            setLoading(false);
        }
    };

    // Получить список сотрудников
    const handleFetchPersons = async () => {
        try {
            const data = await fetchPersons();
            setPersons(data);
        } catch (error) {
            handleError(
                'Ошибка при получении информации о сотрудниках:',
                error
            );
        } finally {
            setLoading(false);
        }
    };

    // Добавить сотрудника
    const handleAddPerson = async () => {
        try {
            await addPerson(newPerson);
            setNewPerson({ name: '' });
            handleFetchPersons();
        } catch (error) {
            handleError('Ошибка при добавлении сотрудника:', error);
        }
    };

    // Обновить данные выбранного сотрудника
    const handleUpdatePerson = async (personId) => {
        try {
            await updatePerson(personId, newPerson);
            setNewPerson({ name: '' });
            setSelectedPerson('');
            setSelectedPersonId(null);
            handleFetchPersons();
        } catch (error) {
            handleError('Ошибка при обновлении сотрудника:', error);
        }
    };

    // Удалить выбранного сотрудника
    const handleDeletePerson = async (personId) => {
        try {
            await deletePerson(personId);
            // Обновляем состояние, удаляя сотрудника из списка
            setPersons(persons.filter((person) => person.id !== personId));
            handleFetchPersons();
        } catch (error) {
            handleError('Ошибка при удалении сотрудника: ' + error);
        }
    };

    // Добавить фотографии лиц выбранному сотруднику
    const handleAddFace = async () => {
        try {
            await addFace(selectedPersonId, newFace);
            setNewFace([]);
            handleFetchPersons();
        } catch (error) {
            handleError('Ошибка при загрузке лиц сотрудников:', error);
        }
    };

    // Создание сотрудника (объединяет в себя добавление сотрудника и загрузку фотографий)
    const handleCreatePerson = async () => {
        try {
            handleAddPerson();
            if (newFace.length > 0) {
                handleAddFace();
            }
            handleFetchPersons();
        } catch (error) {
            handleError('Ошибка при создании сотрудника:', error);
        }
    };

    // Модульные окна
    const openUploadWindow = () => setIsUploadWindowOpen(true);
    const closeUploadWindow = () => setIsUploadWindowOpen(false);
    const openEditWindow = () => setIsEditWindowOpen(true);
    const closeEditWindow = () => setIsEditWindowOpen(false);
    const openLogsFilterWindow = () => setIsLogsFilterWindowOpen(true);
    const closeLogsFilterWindow = () => setIsLogsFilterWindowOpen(false);

    // Загрузка новых лиц
    const handleFileChange = (event) => {
        const files = event.target.files;
        setNewFace(files);
    };

    // Программная имитация клика
    const handleButtonClick = () => {
        fileInputRef.current.click();
    };

    // Изменение имени сотрудника
    const handleStaffSelectChange = (event) => {
        const selectedValue = event.target.value;
        setSelectedPerson(selectedValue);
        const index = persons.findIndex(
            (person) => person.name === selectedValue
        );
        setSelectedPersonId(persons[index].id);
        setNewPerson(selectedValue);
    };

    // Выбор сотрудника в выпадающем списке
    const handleStaffDropdownSelectChange = (event) => {
        const selectedValue = event.target.value;
        setSelectedPerson(selectedValue);
        const index = persons.findIndex(
            (person) => person.name === selectedValue
        );
        setSelectedPersonId(persons[index].id);
    };

    // Выбор вида трекинга в выпадающем списке
    const handleModelSelectChange = (event) => {
        const selectedValue = event.target.value;
        setSelectedModel(selectedValue);
    };

    // При нажатии на сотрудника
    const handlePersonClick = (index) => {
        if (selectedPersonIndex === index) {
            setSelectedPersonIndex(null);
        } else {
            setSelectedPersonIndex(index);
        }
    };

    // При нажатии на событие
    const handleLogClick = (index) => {
        if (selectedLogIndex === index) {
            setSelectedLogIndex(null);
        } else {
            setSelectedLogIndex(index);
        }
    };

    // Получить id стрима по id камеры
    const getStreamId = (cameraId, streams) => {
        const stream = streams.find((stream) => stream.camera_id === cameraId);
        return 19;
        //return stream ? stream.id : null;
    };

    // Получить url стрима по id камеры
    const getStreamUrl = (cameraId, streams) => {
        const stream = streams.find((stream) => stream.id === 19);
        //const stream = streams.find((stream) => stream.camera_id === cameraId);
        return stream ? stream.output_stream : null;
    };

    // Обработчик ошибок
    const handleError = (error) => {
        setError(error);
        console.error(error);
    };

    const handleSendEmail = async () => {
        try {
            await sendEmail();
            console.log('Список событий отправлен на почту!');
        } catch (error) {
            handleError('Ошибка при отправке списка событий на почту:', error);
        }
    };

    return {
        files,
        newPerson,
        newFace,
        persons,
        isUploadWindowOpen,
        isEditWindowOpen,
        loading,
        error,
        fileInputRef,
        selectedPerson,
        selectedPersonIndex,
        selectedPersonId,
        selectedModel,
        selectedLogIndex,
        isLogsFilterWindowOpen,
        setNewPerson,
        setSelectedPerson,
        handleDownloadLogs,
        handleDownloadCameraLogs,
        handleDownloadPersonLogs,
        handleFetchLogsList,
        handleFetchCameraLogsList,
        handleFetchPersonLogsList,
        handleLogClick,
        handleFetchPersons,
        handleCreatePerson,
        handleUpdatePerson,
        handleDeletePerson,
        handleAddFace,
        openUploadWindow,
        closeUploadWindow,
        openEditWindow,
        closeEditWindow,
        handleFileChange,
        handleButtonClick,
        handleStaffSelectChange,
        handlePersonClick,
        handleStaffDropdownSelectChange,
        handleModelSelectChange,
        getStreamId,
        getStreamUrl,
        openLogsFilterWindow,
        closeLogsFilterWindow,
        resetSelectedPerson,
        handleSendEmail,
    };
};

export default DataHandlers;
