import { useState } from 'react';
import './NotificationSelector.css';

const NotificationSelector = () => {
    const [selectedOption, setSelectedOption] = useState('');
    const [inputValue, setInputValue] = useState('');

    const handleOptionChange = (event) => {
        setSelectedOption(event.target.value);
        setInputValue('');
    };

    const handleInputChange = (event) => {
        setInputValue(event.target.value);
    };

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
                    <option value="phone">СМС на телефон</option>
                </select>
            </div>

            {selectedOption && (
                <div className="notification-input">
                    <label htmlFor="notification-input">
                        {selectedOption === 'email' &&
                            'Введите почтовый адрес:'}
                        {selectedOption === 'phone' &&
                            'Введите номер телефона:'}
                    </label>
                    <br />
                    <input
                        className="text-input"
                        id="notification-input"
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        placeholder={
                            selectedOption === 'email'
                                ? 'example@email.com'
                                : '+79876543210'
                        }
                    />
                </div>
            )}
        </div>
    );
};

export default NotificationSelector;
