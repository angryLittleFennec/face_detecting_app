import ModalWindow from '../UI/ModalWindow';
import './CameraSettingsWindow.css';

const CameraSettingsWindow = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <ModalWindow isOpen={isOpen} onClose={onClose}>
            <h1>Настройка камеры</h1>
            <p>Здесь будут настройки камеры...</p>
            <button onClick={onClose}>Закрыть</button>
        </ModalWindow>
    );
};

export default CameraSettingsWindow;
