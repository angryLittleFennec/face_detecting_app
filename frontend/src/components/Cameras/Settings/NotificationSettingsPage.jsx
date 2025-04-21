import NotificationSelector from './NotificationSelector';
import NavigationHandlers from '../../GeneralComponents/NavigationHandlers';
import ButtonWithTooltip from '../../UI/ButtonWithTooltip';
import './CamerasSettingsPage.css';

function NotificationSettingsPage({ onLogout }) {
    const {
        goToCamerasHandler,
        logoutHandler,
        goToSettingsHandler,
        goToAdditionalSettingsHandler,
    } = NavigationHandlers(onLogout);

    return (
        <div className="page-container">
            <div className="main-content">
                <div className="settings-page-container">
                    <div className="choose-settings-container">
                        <button
                            className="choose-settings-button"
                            onClick={goToSettingsHandler}
                        >
                            Камеры
                        </button>
                        <br />
                        <button className="selected-button">Уведомления</button>
                        <br />
                        <button
                            className="choose-settings-button"
                            onClick={goToAdditionalSettingsHandler}
                        >
                            Дополнительно
                        </button>
                    </div>
                    <div className="settings-container">
                        <h1>Уведомление о событиях</h1>
                        <NotificationSelector />
                        <button>Подтвердить</button>
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
            </div>
        </div>
    );
}

export default NotificationSettingsPage;
