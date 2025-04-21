import PdfViewer from '../GeneralComponents/PdfViewer';
import DataHandlers from '../DataPages/DataHandlers';
import ModalWindow from '../UI/ModalWindow';
import './CameraLogsWindow.css';

const CameraLogsWindow = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const { files, handleDownload } = DataHandlers();

    return (
        <ModalWindow isOpen={isOpen} onClose={onClose}>
            <div className="logs-container">
                <h1>Логи камеры</h1>
                {files.length > 0 ? (
                    <PdfViewer value={files[0]} />
                ) : (
                    <p>Логи отсутствуют</p>
                )}
            </div>
            {files.length > 0 ? (
                <div className="double-button">
                    <button onClick={() => handleDownload(files[0])}>
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
