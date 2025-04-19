import CamerasHandlers from '../CamerasHandlers';
import NavigationHandlers from '../../GeneralComponents/NavigationHandlers';
import ButtonWithTooltip from '../../UI/ButtonWithTooltip';
import './CamerasSettingsPage.css';

function AdditionalSettingsPage({ onLogout }) {
    const {
        goToCamerasHandler,
        logoutHandler,
        goToNotificationSettingsHandler,
        goToSettingsHandler,
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
                        <button
                            className="choose-settings-button"
                            onClick={goToNotificationSettingsHandler}
                        >
                            Уведомления
                        </button>
                        <br />
                        <button className="selected-button">
                            Дополнительно
                        </button>
                    </div>
                    <div className="settings-container">
                        <h1>Дополнительные настройки</h1>
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

export default AdditionalSettingsPage;
