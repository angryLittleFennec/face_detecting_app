import { useState, useEffect } from 'react';
import CamerasHandlers from '../CamerasHandlers';
import SettingsMenu from './SettingsMenu';
import NavigationHandlers from '../../GeneralComponents/NavigationHandlers';
import ButtonWithTooltip from '../../UI/ButtonWithTooltip';
import './StreamsSettingsPage.css';

function StreamsSettingPage() {
    const { goToCamerasHandler, logoutHandler } = NavigationHandlers();

    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const {
        selectedStream,
        selectedStreamIndex,
        streams,
        loading,
        error,
        newStream,
        setNewStream,
        handleAddStream,
        handleDeleteStream,
        handleFetchStreams,
        handleSelectStreamChange,
    } = CamerasHandlers();

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

    // if (loading) {
    //     handleFetchStreams();
    //     return <h2>Загрузка...</h2>;
    // }

    if (error) {
        return <h2>Ошибка: {error}</h2>;
    }

    return (
        <div className="page-container">
            <div className="main-content">
                <div className="settings-page-container">
                    <SettingsMenu activePage="streams" />
                    <div className="settings-container">
                        <h1>Видеопотоки</h1>
                        {!isAuthenticated ? (
                            <div className="cameras-settings-container">
                                <h3>
                                    Доступ к настройкам видеопотоков
                                    осуществляется по паролю
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
                                <div>
                                    <h3>Добавление видеопотока</h3>
                                    <div className="streams-input-info-container">
                                        <input
                                            className="text-input"
                                            type="text"
                                            placeholder="Название стрима"
                                            value={newStream.name}
                                            onChange={(e) =>
                                                setNewStream({
                                                    ...newStream,
                                                    name: e.target.value,
                                                })
                                            }
                                        />
                                        <input
                                            className="number"
                                            type="number"
                                            placeholder="ID соответствующей камеры"
                                            value={newStream.camera_id}
                                            onChange={(e) =>
                                                setNewStream({
                                                    ...newStream,
                                                    id: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <button onClick={handleAddStream}>
                                        Добавить видеопоток
                                    </button>
                                </div>
                                <div>
                                    <h3>Удаление видеопотока</h3>
                                    <div>
                                        <div className="text-align-left">
                                            <select
                                                value={selectedStream}
                                                onChange={
                                                    handleSelectStreamChange
                                                }
                                            >
                                                <option value="" disabled>
                                                    Выберите видеопоток
                                                </option>
                                                {streams.map(
                                                    (stream, index) => (
                                                        <option
                                                            key={index}
                                                            value={stream.name}
                                                        >
                                                            {stream.name}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>
                                        {selectedStream && (
                                            <div>
                                                <button
                                                    className="delete-button"
                                                    onClick={() =>
                                                        handleDeleteStream(
                                                            streams[
                                                                selectedStreamIndex
                                                            ].camera_id
                                                        )
                                                    }
                                                >
                                                    Удалить видеопоток
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
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

export default StreamsSettingPage;
