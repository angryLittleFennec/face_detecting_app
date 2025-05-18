import DataHandlers from './DataHandlers';
import ModalWindow from '../UI/ModalWindow';
import FileUploadButton from '../UI/FileUploadButton';
import './FileUploadWindow.css';

const FileUploadWindow = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const {
        newPerson,
        newFace,
        fileInputRef,
        setNewPerson,
        handleCreatePerson,
        handleFileChange,
        handleButtonClick,
    } = DataHandlers();

    return (
        <ModalWindow isOpen={isOpen} onClose={onClose}>
            <h1>Добавление сотрудников</h1>
            <div className="file-upload-window">
                <h4>ФИО сотрудника</h4>
                <p>(обязательное поле)</p>
                <input
                    placeholder="Фамилия Имя Отчество"
                    value={newPerson.name}
                    onChange={(e) =>
                        setNewPerson({
                            name: e.target.value,
                        })
                    }
                />
                <h4>Фотографии сотрудника</h4>
                <div className="photo-container">
                    {newFace.length > 0 ? (
                        <p>Добавлено {newFace.length} фотографий</p>
                    ) : (
                        <p>Фотографии отсутствуют</p>
                    )}
                </div>
                <FileUploadButton
                    onClick={handleButtonClick}
                    onChange={handleFileChange}
                    fileRef={fileInputRef}
                />
            </div>
            <div className="button-container">
                <button className="add-button" onClick={handleCreatePerson}>
                    Добавить
                </button>
                <button className="close-button" onClick={onClose}>
                    Закрыть
                </button>
            </div>
        </ModalWindow>
    );
};

export default FileUploadWindow;
