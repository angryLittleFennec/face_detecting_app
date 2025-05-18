import DataHandlers from './DataHandlers';
import FileUploadWindow from './FileUploadWindow';
import StaffEditWindow from './StaffEditWindow';
import NavigationHandlers from '../GeneralComponents/NavigationHandlers';
import ButtonWithTooltip from '../UI/ButtonWithTooltip';
import './StaffPage.css';

function StaffPage() {
    const { goToCamerasHandler, logoutHandler } = NavigationHandlers();

    const {
        persons,
        isUploadWindowOpen,
        isEditWindowOpen,
        loading,
        error,
        selectedPersonIndex,
        handleFetchPersons,
        openUploadWindow,
        closeUploadWindow,
        openEditWindow,
        closeEditWindow,
        handleDeletePerson,
        handlePersonClick,
    } = DataHandlers();

    const handleDeleteButton = (person) => {
        const confirmDelete = window.confirm(
            `Вы точно хотите удалить сотрудника ${person.name}?`
        );
        if (confirmDelete) {
            handleDeletePerson(person.id);
        }
    };

    if (loading) {
        handleFetchPersons();
        return <h2>Загрузка...</h2>;
    }

    if (error) {
        return <h2>Ошибка: {error}</h2>;
    }

    return (
        <div className="page-container">
            <div className="main-content justify-content-center">
                <div div className="staff-container">
                    <h1>Список сотрудников</h1>
                    <ul className="files-list">
                        {persons.length > 0 ? (
                            persons.map((person, index) => (
                                <div>
                                    <div className="files-list-element">
                                        <img
                                            src={
                                                selectedPersonIndex === index
                                                    ? '/icons/list-element-active.png'
                                                    : '/icons/list-element.png'
                                            }
                                            alt="элемент списка"
                                        />
                                        <li
                                            onClick={() =>
                                                handlePersonClick(index)
                                            }
                                            key={index}
                                        >
                                            {person.name}
                                        </li>
                                    </div>
                                    {selectedPersonIndex === index &&
                                        (person.faces.length % 100 === 1 ? (
                                            <div className="faces-gallery">
                                                <p>
                                                    Загружено{' '}
                                                    {person.faces.length}{' '}
                                                    изображение
                                                </p>
                                            </div>
                                        ) : person.faces.length % 100 > 1 &&
                                          person.faces.length % 100 < 5 ? (
                                            <div className="faces-gallery">
                                                <p>
                                                    Загружено{' '}
                                                    {person.faces.length}{' '}
                                                    изображения
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="faces-gallery">
                                                <p>
                                                    Загружено{' '}
                                                    {person.faces.length}{' '}
                                                    изображений
                                                </p>
                                            </div>
                                        ))}
                                    {selectedPersonIndex === index && (
                                        <div className="staff-button-container">
                                            <button
                                                className="delete-person-button"
                                                onClick={() =>
                                                    handleDeleteButton(person)
                                                }
                                            >
                                                Удалить
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div>
                                <p>Сотрудники отсутствуют</p>
                            </div>
                        )}
                    </ul>
                    <div className="staff-button-container-bottom">
                        <button onClick={openEditWindow}>
                            Изменить сотрудника
                        </button>
                        <button onClick={openUploadWindow}>
                            Добавить сотрудника
                        </button>
                    </div>
                </div>
            </div>
            <div className="left-menu">
                <div className="top-menu-part">
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/back-icon-white.png"
                        altText="Назад"
                        onClick={goToCamerasHandler}
                    />
                </div>
                <div className="bottom-menu-part">
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/exit-icon-white.png"
                        altText="Выход"
                        onClick={logoutHandler}
                    />
                </div>
                <FileUploadWindow
                    isOpen={isUploadWindowOpen}
                    onClose={closeUploadWindow}
                />
                <StaffEditWindow
                    isOpen={isEditWindowOpen}
                    onClose={closeEditWindow}
                />
            </div>
        </div>
    );
}

export default StaffPage;
