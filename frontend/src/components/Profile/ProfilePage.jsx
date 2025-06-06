// Страница профиля
import ProfileHandlers from './ProfileHandlers';
import CamerasHandlers from '../Cameras/CamerasHandlers';
import NavigationHandlers from '../GeneralComponents/NavigationHandlers';
import ButtonWithTooltip from '../UI/ButtonWithTooltip';
import './ProfilePage.css';

function ProfilePage() {
    const { goToCamerasHandler, logoutHandler } = NavigationHandlers();

    const {
        username,
        email,
        isEditingContact,
        isEditingAdditional,
        about,
        handleEditContactClick,
        handleEditAdditionalClick,
        handleChangeContact,
        handleChangeAdditional,
        handleSaveContactClick,
        handleSaveAdditionalClick,
        handleFetchCurrentUser,
    } = ProfileHandlers();

    const { loading, error, setLoading } = CamerasHandlers();

    // Получение информации о пользователе перед загрузкой страницы
    if (loading) {
        handleFetchCurrentUser();
        setLoading(false);
        return <h2>Загрузка...</h2>;
    }

    if (error) {
        return <h2>Ошибка: {error}</h2>;
    }

    return (
        <div className="page-container">
            <div className="profile-main-content">
                <div className="profile-container-250px">
                    <h2>Основная информация</h2>
                    <p>Имя пользователя: {username}</p>
                </div>
                <div className="profile-container-200px">
                    <h2>Контактная информация</h2>
                    {isEditingContact ? (
                        <>
                            <div className="profile-field">
                                <p>Адрес электронной почты: </p>
                                <input
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={handleChangeContact}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <p>Адрес электронной почты: {email}</p>
                        </>
                    )}
                    <button
                        onClick={
                            isEditingContact
                                ? handleSaveContactClick
                                : handleEditContactClick
                        }
                    >
                        {isEditingContact ? 'Сохранить' : 'Редактировать'}
                    </button>
                </div>
                <div className="profile-container-200px">
                    <h2>Дополнительная информация</h2>
                    {isEditingAdditional ? (
                        <div className="profile-field">
                            <p>О себе: </p>
                            <textarea
                                name="about"
                                value={about}
                                onChange={handleChangeAdditional}
                            />
                        </div>
                    ) : (
                        <p>О себе: {about}</p>
                    )}
                    <button
                        onClick={
                            isEditingAdditional
                                ? handleSaveAdditionalClick
                                : handleEditAdditionalClick
                        }
                    >
                        {isEditingAdditional ? 'Сохранить' : 'Редактировать'}
                    </button>
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
            </div>
        </div>
    );
}

export default ProfilePage;
