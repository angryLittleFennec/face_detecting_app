// Страница для настройки распознавания лиц
import CamerasHandlers from '../CamerasHandlers';
import SettingsMenu from './SettingsMenu';
import RecognitionThresholdSettings from './RecognitionThresholdSettings';
import SettingsHandlers from './SettingsHandlers';
import NavigationHandlers from '../../GeneralComponents/NavigationHandlers';
import ButtonWithTooltip from '../../UI/ButtonWithTooltip';

function FaceRecognitionSettingsPage() {
    const { goToCamerasHandler, logoutHandler } = NavigationHandlers();

    const { loading, error, handleFetchCameras } = CamerasHandlers();

    const { password, isAdmin, setPassword, handleAdminAccess } =
        SettingsHandlers();

    // Получение списка камер перед загрузкой страницы
    if (loading) {
        handleFetchCameras();
        return <h2>Загрузка...</h2>;
    }

    if (error) {
        return <h2>Ошибка: {error}</h2>;
    }

    return (
        <div className="page-container">
            <div className="main-content">
                <div className="settings-page-container">
                    <SettingsMenu activePage="recognition" />
                    <div className="settings-container">
                        <h1>Распознавание лиц</h1>
                        {!isAdmin ? (
                            <div className="cameras-settings-container">
                                <h3>
                                    Доступ к настройкам камер осуществляется по
                                    паролю
                                </h3>
                                <input
                                    className="text-input"
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="Введите пароль"
                                />
                                <button
                                    className="settings-container-button"
                                    onClick={handleAdminAccess}
                                >
                                    Войти
                                </button>
                            </div>
                        ) : (
                            <div className="cameras-settings-container">
                                <RecognitionThresholdSettings />
                            </div>
                        )}
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

export default FaceRecognitionSettingsPage;
