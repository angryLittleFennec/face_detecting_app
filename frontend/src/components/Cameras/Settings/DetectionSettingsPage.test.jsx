import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DetectionSettingsPage from './DetectionSettingsPage'; // Укажите правильный путь к вашему файлу
import * as NavigationHandlers from '../../GeneralComponents/NavigationHandlers';
import * as CamerasHandlers from '../CamerasHandlers';
import * as SettingsHandlers from './SettingsHandlers';

// Мокаем зависимости
jest.mock('../../GeneralComponents/NavigationHandlers');
jest.mock('../CamerasHandlers');
jest.mock('./SettingsHandlers');
jest.mock('./DetectionThresholdSettings', () => () => (
    <div>DetectionThresholdSettings</div>
));

describe('DetectionSettingsPage Component', () => {
    beforeEach(() => {
        // Устанавливаем начальные значения для мока
        NavigationHandlers.default.mockReturnValue({
            goToCamerasHandler: jest.fn(),
            logoutHandler: jest.fn(),
        });

        CamerasHandlers.default.mockReturnValue({
            loading: false,
            error: null,
            handleFetchCameras: jest.fn(),
        });

        SettingsHandlers.default.mockReturnValue({
            password: '',
            isAdmin: false,
            setPassword: jest.fn(),
            handleAdminAccess: jest.fn(),
        });
    });

    test('renders loading state', () => {
        CamerasHandlers.default.mockReturnValue({
            loading: true,
            error: null,
            handleFetchCameras: jest.fn(),
        });

        render(<DetectionSettingsPage />);

        expect(screen.getByText(/Загрузка.../i)).toBeInTheDocument();
    });

    test('renders error state', () => {
        CamerasHandlers.default.mockReturnValue({
            loading: false,
            error: 'Ошибка загрузки камер',
            handleFetchCameras: jest.fn(),
        });

        render(<DetectionSettingsPage />);

        expect(
            screen.getByText(/Ошибка: Ошибка загрузки камер/i)
        ).toBeInTheDocument();
    });

    test('renders password input when not admin', () => {
        render(<DetectionSettingsPage />);

        expect(
            screen.getByPlaceholderText(/Введите пароль/i)
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Войти/i })
        ).toBeInTheDocument();
    });

    test('renders DetectionThresholdSettings when admin', () => {
        SettingsHandlers.default.mockReturnValue({
            password: '',
            isAdmin: true,
            setPassword: jest.fn(),
            handleAdminAccess: jest.fn(),
        });

        render(<DetectionSettingsPage />);

        expect(
            screen.getByText(/DetectionThresholdSettings/i)
        ).toBeInTheDocument();
    });

    test('calls goToCamerasHandler on back button click', () => {
        const { goToCamerasHandler } = NavigationHandlers.default();

        render(<DetectionSettingsPage />);

        fireEvent.click(screen.getByAltText(/Назад/i));

        expect(goToCamerasHandler).toHaveBeenCalled();
    });

    test('calls logoutHandler on exit button click', () => {
        const { logoutHandler } = NavigationHandlers.default();

        render(<DetectionSettingsPage />);

        fireEvent.click(screen.getByAltText(/Выход/i));

        expect(logoutHandler).toHaveBeenCalled();
    });
});
