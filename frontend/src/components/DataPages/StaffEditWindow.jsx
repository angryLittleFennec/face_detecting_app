import DataHandlers from './DataHandlers';
import ModalWindow from '../UI/ModalWindow';
import FileUploadButton from '../UI/FileUploadButton';
import './StaffEditWindow.css';

const StaffEditWindow = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const {
        persons,
        newPerson,
        newFace,
        fileInputRef,
        selectedPerson,
        loading,
        error,
        selectedPersonId,
        setNewPerson,
        handleFileChange,
        handleButtonClick,
        handleStaffSelectChange,
        handleFetchPersons,
        handleUpdatePerson,
        handleAddFace,
    } = DataHandlers();

    if (loading) {
        handleFetchPersons();
        return <h2>Загрузка...</h2>;
    }

    if (error) {
        return <h2>Ошибка: {error}</h2>;
    }

    return (
        <ModalWindow isOpen={isOpen} onClose={onClose}>
            <h1>Изменить сотрудника</h1>
            <div className="staff-edit-window">
                <h4>Выберите сотрудника</h4>
                <select
                    value={selectedPerson}
                    onChange={handleStaffSelectChange}
                >
                    <option value="" disabled>
                        Выберите сотрудника
                    </option>
                    {persons.map((person, index) => (
                        <option key={index} value={person.name}>
                            {person.name}
                        </option>
                    ))}
                </select>
                <h4>Изменить ФИО</h4>
                <input
                    placeholder="Фамилия Имя Отчество"
                    value={newPerson.name}
                    onChange={(e) =>
                        setNewPerson({
                            name: e.target.value,
                        })
                    }
                />
                <button
                    className="add-button"
                    onClick={() => handleUpdatePerson(selectedPersonId)}
                >
                    Изменить
                </button>
                <h4>Фотографии сотрудника</h4>
                <div className="photo-container">
                    {newFace.length > 0 ? (
                        <p>Добавлено {newFace.length} фотографий</p>
                    ) : (
                        <p>Фотографии отсутствуют</p>
                    )}
                </div>
                {selectedPersonId && (
                    <FileUploadButton
                        onClick={handleButtonClick}
                        onChange={handleFileChange}
                        fileRef={fileInputRef}
                    />
                )}
                {console.log(newFace)}
                {newFace.length > 0 && (
                    <button className="close-button" onClick={handleAddFace}>
                        Загрузить в систему
                    </button>
                )}
            </div>
            <div className="button-container">
                <button className="close-button" onClick={onClose}>
                    Закрыть
                </button>
            </div>
        </ModalWindow>
    );
};

export default StaffEditWindow;
