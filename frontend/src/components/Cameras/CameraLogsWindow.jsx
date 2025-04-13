import ModalWindow from '../UI/ModalWindow';
import './CameraLogsWindow.css';

const CameraLogsWindow = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <ModalWindow isOpen={isOpen} onClose={onClose}>
            <h1>Логи камеры</h1>
            <p>Здесь будут логи камеры...</p>
            <button onClick={onClose}>Закрыть</button>
        </ModalWindow>
    );
};

export default CameraLogsWindow;
