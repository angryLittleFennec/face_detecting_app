// Модульное окно для фильтрации событий
import { useEffect } from 'react';
import DataHandlers from './DataHandlers';
import CamerasHandlers from '../Cameras/CamerasHandlers';
import ModalWindow from '../UI/ModalWindow';
import Dropdown from '../UI/Dropdown';
import './LogsFilterWindow.css';

const LogsFilterWindow = ({ isOpen, onClose }) => {
    const {
        persons,
        files,
        selectedPerson,
        selectedPersonId,
        handleFetchPersons,
        getStreamId,
        handleStaffDropdownSelectChange,
        handleFetchCameraLogsList,
        handleFetchPersonLogsList,
        resetSelectedPerson,
    } = DataHandlers();

    const {
        loading,
        cameras,
        streams,
        selectedCamera,
        selectedCameraId,
        handleFetchCameras,
        handleSelectChange,
        resetSelectedCamera,
    } = CamerasHandlers();

    useEffect(() => {
        const fetchData = async () => {
            await handleFetchCameras();
        };

        fetchData();
    }, [files]);

    if (loading) {
        handleFetchCameras();
        handleFetchPersons();
        return <h2>Загрузка...</h2>;
    }

    if (!isOpen) return null;

    return (
        <ModalWindow isOpen={isOpen} onClose={onClose}>
            <h1>Фильтрация событий</h1>
            <div className="logs-filter-window">
                <h4>Выберите камеру</h4>
                <Dropdown
                    children={cameras}
                    selectedValue={selectedCamera}
                    onChange={handleSelectChange}
                    text="Название камеры"
                />
                <h4>Выберите сотрудника</h4>
                <Dropdown
                    children={persons}
                    selectedValue={selectedPerson}
                    onChange={handleStaffDropdownSelectChange}
                    text="Имя сотрудника"
                />
                <button
                    className="reset-button"
                    onClick={() => {
                        resetSelectedCamera();
                        resetSelectedPerson();
                    }}
                >
                    Сбросить фильтры
                </button>
            </div>
            <div className="button-container">
                <button
                    className="add-button"
                    onClick={() => {
                        if (selectedCamera) {
                            handleFetchCameraLogsList(
                                getStreamId(selectedCameraId, streams)
                            );
                        }
                        if (selectedPerson) {
                            handleFetchPersonLogsList(
                                getStreamId(selectedPersonId, streams)
                            );
                        }
                    }}
                >
                    Применить
                </button>
                <button className="close-button" onClick={onClose}>
                    Закрыть
                </button>
            </div>
        </ModalWindow>
    );
};

export default LogsFilterWindow;
