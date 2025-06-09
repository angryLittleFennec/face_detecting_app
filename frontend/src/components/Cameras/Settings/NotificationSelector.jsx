// Форма для настройки уведомлений
import { useState, useEffect } from 'react';
import ProfileHandlers from '../../Profile/ProfileHandlers';
import CamerasHandlers from '../CamerasHandlers';
import './NotificationSelector.css';

const NotificationSelector = () => {
    const [selectedOption, setSelectedOption] = useState('');

    const { email, handleFetchCurrentUser, handleChangeContact } =
        ProfileHandlers();

    const { loading, error, setLoading } = CamerasHandlers();

    // Смена выбора в выпадающем списке
    const handleOptionChange = (event) => {
        setSelectedOption(event.target.value);
    };

    if (loading) {
        handleFetchCurrentUser();
        setLoading(false);
        return <h2>Загрузка...</h2>;
    }

    if (error) {
        return <h2>Ошибка: {error}</h2>;
    }

    return (
        <div className="notification-selector-container">
            <div>
                <label htmlFor="notification-options">
                    Выберите способ отправки уведомлений:
                </label>
                <select
                    id="notification-options"
                    value={selectedOption}
                    onChange={handleOptionChange}
                >
                    <option value="">Выберите способ уведомления</option>
                    <option value="email">Письмом на email</option>
                </select>
            </div>

            {selectedOption && (
                <div className="notification-input">
                    <label htmlFor="notification-input">
                        Адрес для отправки уведомлений:
                    </label>
                    <br />
                    <input
                        className="text-input"
                        id="notification-input"
                        type="text"
                        value={email}
                        onChange={handleChangeContact}
                        placeholder={'example@email.com'}
                    />
                    <div className="text-align-center">
                        <button className="settings-container-button">
                            Подтвердить
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationSelector;
