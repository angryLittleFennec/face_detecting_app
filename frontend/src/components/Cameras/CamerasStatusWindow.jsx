import ModalWindow from '../UI/ModalWindow';
import './CamerasStatusWindow.css';

const CamerasStatusWindow = ({ isOpen, onClose, cameras }) => {
    if (!isOpen) return null;

    return (
        <ModalWindow isOpen={isOpen} onClose={onClose}>
            <h1>Статус камер</h1>
            <div className="camera-status-container">
                {cameras.length > 0 ? (
                    cameras.map((camera, index) => (
                        <div className="camera-status" key={index}>
                            {camera.is_active ? (
                                <p>{camera.name}: Активна</p>
                            ) : (
                                <p>{camera.name}: Отключена</p>
                            )}
                        </div>
                    ))
                ) : (
                    <h2>Камеры не найдены</h2>
                )}
            </div>
            <button onClick={onClose}>Закрыть</button>
        </ModalWindow>
    );
};

export default CamerasStatusWindow;
