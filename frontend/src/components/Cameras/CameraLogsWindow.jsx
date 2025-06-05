// Модульное окно с логами камеры
import { useParams } from 'react-router';
import DataHandlers from '../DataPages/DataHandlers';
import CamerasHandlers from './CamerasHandlers';
import ModalWindow from '../UI/ModalWindow';
import './CameraLogsWindow.css';

const CameraLogsWindow = ({ isOpen, onClose }) => {
    const { id } = useParams();

    const {
        files,
        selectedLogIndex,
        handleDownloadCameraLogs,
        getStreamId,
        handleLogClick,
    } = DataHandlers();

    const { cameras } = CamerasHandlers();

    if (!isOpen) return null;

    return (
        <ModalWindow isOpen={isOpen} onClose={onClose}>
            <div className="logs-container">
                <h1>Логи камеры</h1>
                {files.length > 0 ? (
                    <ul className="files-list">
                        {files.map((file, index) => (
                            <div>
                                <div className="files-list-element">
                                    <img
                                        src={
                                            selectedLogIndex === index
                                                ? '/icons/list-element-active.png'
                                                : '/icons/list-element.png'
                                        }
                                        alt="элемент списка"
                                    />
                                    <li
                                        onClick={() => handleLogClick(index)}
                                        key={index}
                                    >
                                        Событие №{file.id}
                                    </li>
                                </div>
                                {selectedLogIndex === index && (
                                    <div className="event-description">
                                        <p>Тип события: {file.event_type}</p>
                                        <p>Время события: {file.timestamp}</p>
                                        <p>Сотрудник: {file.person_id}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </ul>
                ) : (
                    <p>Логи отсутствуют</p>
                )}
            </div>
            {files.length > 0 ? (
                <div className="double-button">
                    <button
                        onClick={() =>
                            handleDownloadCameraLogs(
                                getStreamId(cameras[id].id)
                            )
                        }
                    >
                        Скачать
                    </button>
                    <button onClick={onClose}>Закрыть</button>
                </div>
            ) : (
                <div className="double-button">
                    <button onClick={onClose}>Закрыть</button>
                </div>
            )}
        </ModalWindow>
    );
};

export default CameraLogsWindow;
