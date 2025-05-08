import { useState, useEffect } from 'react';
import CamerasHandlers from '../CamerasHandlers';
import SettingsMenu from './SettingsMenu';
import RecognitionThresholdSettings from './RecognitionThresholdSettings';
import NavigationHandlers from '../../GeneralComponents/NavigationHandlers';
import ButtonWithTooltip from '../../UI/ButtonWithTooltip';

function FaceRecognitionSettingsPage() {
    const { goToCamerasHandler, logoutHandler } = NavigationHandlers();

    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const { loading, error, handleFetchCameras } = CamerasHandlers();

    const handleAuthenticate = () => {
        setIsAuthenticated(true); // Пока не работает аутентификация
        // Логика аутентификации
        /*if (password === 'your_password') {
            setIsAuthenticated(true);
        } else {
            alert('Неверный пароль');
        }*/
    };

    /*
    useEffect(() => {
        handleFetchCameras();
    }, [handleFetchCameras]);*/

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
                        {!isAuthenticated ? (
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
                                <button onClick={handleAuthenticate}>
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
