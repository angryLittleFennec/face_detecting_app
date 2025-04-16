import NavigationHandlers from '../GeneralComponents/NavigationHandlers';
import ButtonWithTooltip from '../UI/ButtonWithTooltip';
import './CamerasSettingsPage.css';

function CamerasSettingPage({ onLogout }) {
    const { goToCamerasHandler, logoutHandler } = NavigationHandlers(onLogout);

    return (
        <div className="page-container">
            <div className="main-content">
                <div className="cameras-settings-container-250px">
                    <h2>Камеры</h2>
                </div>
                <div className="cameras-settings-container-200px">
                    <h2>Уведомление о событиях</h2>
                </div>
                <div className="cameras-settings-container-200px">
                    <h2>Дополнительные настройки</h2>
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

export default CamerasSettingPage;
