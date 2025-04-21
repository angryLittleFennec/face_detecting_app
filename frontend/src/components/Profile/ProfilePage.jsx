import NavigationHandlers from '../GeneralComponents/NavigationHandlers';
import ButtonWithTooltip from '../UI/ButtonWithTooltip';
import './ProfilePage.css';

function ProfilePage({ onLogout }) {
    const { goToCamerasHandler, logoutHandler } = NavigationHandlers(onLogout);

    return (
        <div className="page-container">
            <div className="profile-main-content">
                <div className="profile-container-250px">
                    <h2>Основная информация</h2>
                    <p>Имя: </p>
                    <p>Фамилия: </p>
                    <p>Отчество: </p>
                    <p>Должность: </p>
                    <button>Редактировать</button>
                </div>
                <div className="profile-container-200px">
                    <h2>Контактная информация</h2>
                    <p>Адрес электронной почты: </p>
                    <p>Номер телефона: </p>
                    <button>Редактировать</button>
                </div>
                <div className="profile-container-200px">
                    <h2>Дополнительная информация</h2>
                    <p>О себе: </p>
                    <button>Редактировать</button>
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
