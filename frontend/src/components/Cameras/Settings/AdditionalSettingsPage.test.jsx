import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AdditionalSettingsPage from './AdditionalSettingsPage';
import NavigationHandlers from '../../GeneralComponents/NavigationHandlers';

// Мокаем NavigationHandlers
jest.mock('../../GeneralComponents/NavigationHandlers');

describe('AdditionalSettingsPage Component', () => {
    let onLogout;
    let goToCamerasHandler;
    let logoutHandler;
    let goToNotificationSettingsHandler;
    let goToSettingsHandler;

    beforeEach(() => {
        onLogout = jest.fn();
        goToCamerasHandler = jest.fn();
        logoutHandler = jest.fn();
        goToNotificationSettingsHandler = jest.fn();
        goToSettingsHandler = jest.fn();

        // Настраиваем мок для NavigationHandlers
        NavigationHandlers.mockReturnValue({
            goToCamerasHandler,
            logoutHandler,
            goToNotificationSettingsHandler,
            goToSettingsHandler,
        });
    });

    test('renders correctly', () => {
        render(<AdditionalSettingsPage onLogout={onLogout} />);

        // Проверяем наличие заголовка
        expect(
            screen.getByText('Дополнительные настройки')
        ).toBeInTheDocument();

        // Проверяем наличие кнопок
        expect(
            screen.getByRole('button', { name: /камеры/i })
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /уведомления/i })
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /дополнительно/i })
        ).toBeInTheDocument();
    });

    test('calls navigation handlers on button clicks', () => {
        render(<AdditionalSettingsPage onLogout={onLogout} />);

        // Клик по кнопке "Камеры"
        fireEvent.click(screen.getByRole('button', { name: /камеры/i }));
        expect(goToSettingsHandler).toHaveBeenCalledTimes(1);

        // Клик по кнопке "Уведомления"
        fireEvent.click(screen.getByRole('button', { name: /уведомления/i }));
        expect(goToNotificationSettingsHandler).toHaveBeenCalledTimes(1);

        // Клик по кнопке "Назад"
        fireEvent.click(screen.getByRole('button', { name: /назад/i }));
        expect(goToCamerasHandler).toHaveBeenCalledTimes(1);

        // Клик по кнопке "Выход"
        fireEvent.click(screen.getByRole('button', { name: /выход/i }));
        expect(logoutHandler).toHaveBeenCalledTimes(1);
    });
});
