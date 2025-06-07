// Страница с дополнительными настройками
import SettingsMenu from './SettingsMenu';
import NotificationSelector from './NotificationSelector';
import NavigationHandlers from '../../GeneralComponents/NavigationHandlers';
import ButtonWithTooltip from '../../UI/ButtonWithTooltip';
import './CamerasSettingsPage.css';

function AdditionalSettingsPage() {
    const { goToCamerasHandler, logoutHandler } = NavigationHandlers();

    return (
        <div className="page-container">
            <div className="main-content">
                <div className="settings-page-container">
                    <SettingsMenu activePage="additional" />
                    <div className="settings-container">
                        <h1>Дополнительные настройки</h1>
                        <h3>Уведомление о событиях</h3>
                        <NotificationSelector />
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
