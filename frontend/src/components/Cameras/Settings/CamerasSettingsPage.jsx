// Страница настройками камер
import CamerasHandlers from '../CamerasHandlers';
import CamerasInputInfo from './CamerasInputInfo';
import SettingsMenu from './SettingsMenu';
import SettingsHandlers from './SettingsHandlers';
import NavigationHandlers from '../../GeneralComponents/NavigationHandlers';
import ButtonWithTooltip from '../../UI/ButtonWithTooltip';
import './CamerasSettingsPage.css';

function CamerasSettingPage() {
    const { goToCamerasHandler, logoutHandler } = NavigationHandlers();

    const {
        selectedCamera,
        selectedCameraIndex,
        cameras,
        loading,
        error,
        newCamera,
        newCameraUpdate,
        setNewCamera,
        setNewCameraUpdate,
        handleAddCamera,
        handleUpdateCamera,
        handleDeleteCamera,
        handleFetchCameras,
        handleSelectChange,
    } = CamerasHandlers();

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
                    <SettingsMenu activePage="settings" />
                    <div className="settings-container">
                        <h1>Камеры</h1>
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
                                <div>
                                    <h3>Добавление камер</h3>
                                    <CamerasInputInfo
                                        newCamera={newCamera}
                                        setNewCamera={setNewCamera}
                                    />
                                    <button
                                        className="settings-container-button"
                                        onClick={handleAddCamera}
                                    >
                                        Добавить камеру
                                    </button>
                                </div>
                                <div>
                                    <h3>Изменение камер</h3>
                                    <div>
                                        <div className="text-align-left">
                                            <select
                                                value={selectedCamera}
                                                onChange={handleSelectChange}
                                            >
                                                <option value="" disabled>
                                                    Выберите камеру
                                                </option>
                                                {cameras.map(
                                                    (camera, index) => (
                                                        <option
                                                            key={index}
                                                            value={camera.name}
                                                        >
                                                            {camera.name}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>
                                        <CamerasInputInfo
                                            newCamera={newCameraUpdate}
                                            setNewCamera={setNewCameraUpdate}
                                        />
                                        {selectedCamera && (
                                            <div>
                                                <button
                                                    className="settings-container-button"
                                                    onClick={handleUpdateCamera}
                                                >
                                                    Обновить Камеру
                                                </button>
                                                <br />
                                                <button
                                                    className="delete-button"
                                                    onClick={() =>
                                                        handleDeleteCamera(
                                                            cameras[
                                                                selectedCameraIndex
                                                            ].id
                                                        )
                                                    }
                                                >
                                                    Удалить камеру
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

export default CamerasSettingPage;
