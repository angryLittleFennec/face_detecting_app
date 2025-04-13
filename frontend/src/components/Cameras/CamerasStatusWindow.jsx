import ModalWindow from '../UI/ModalWindow';
import './CamerasStatusWindow.css';

const CamerasStatusWindow = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <ModalWindow isOpen={isOpen} onClose={onClose}>
            <h1>Статус камер</h1>
            <p>Здесь будет отображаться статус камер...</p>
            <button onClick={onClose}>Закрыть</button>
        </ModalWindow>
    );
};

export default CamerasStatusWindow;
