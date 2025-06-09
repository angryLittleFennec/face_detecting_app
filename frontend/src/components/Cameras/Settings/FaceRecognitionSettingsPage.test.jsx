import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FaceRecognitionSettingsPage from './FaceRecognitionSettingsPage';
import * as NavigationHandlers from '../../GeneralComponents/NavigationHandlers';
import * as CamerasHandlers from '../CamerasHandlers';
import * as SettingsHandlers from './SettingsHandlers';

// Мокаем зависимости
jest.mock('../../GeneralComponents/NavigationHandlers');
jest.mock('../CamerasHandlers');
jest.mock('./SettingsHandlers');
jest.mock('./RecognitionThresholdSettings', () => () => (
    <div>RecognitionThresholdSettings</div>
));
jest.mock('../../UI/ButtonWithTooltip', () => ({ onClick, altText }) => (
    <button onClick={onClick} aria-label={altText}>
        {altText}
    </button>
));

describe('FaceRecognitionSettingsPage Component', () => {
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

        render(<FaceRecognitionSettingsPage />);

        expect(screen.getByText(/Загрузка.../i)).toBeInTheDocument();
    });

    test('renders error state', () => {
        CamerasHandlers.default.mockReturnValue({
            loading: false,
            error: 'Ошибка загрузки камер',
            handleFetchCameras: jest.fn(),
        });

        render(<FaceRecognitionSettingsPage />);

        expect(
            screen.getByText(/Ошибка: Ошибка загрузки камер/i)
        ).toBeInTheDocument();
    });

    test('renders password input when not admin', () => {
        render(<FaceRecognitionSettingsPage />);

        expect(
            screen.getByPlaceholderText(/Введите пароль/i)
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Войти/i })
        ).toBeInTheDocument();
    });

    test('renders RecognitionThresholdSettings when admin', () => {
        SettingsHandlers.default.mockReturnValue({
            password: '',
            isAdmin: true,
            setPassword: jest.fn(),
            handleAdminAccess: jest.fn(),
        });

        render(<FaceRecognitionSettingsPage />);

        expect(
            screen.getByText(/RecognitionThresholdSettings/i)
        ).toBeInTheDocument();
    });

    test('calls goToCamerasHandler on back button click', () => {
        const { goToCamerasHandler } = NavigationHandlers.default();

        render(<FaceRecognitionSettingsPage />);

        fireEvent.click(screen.getByLabelText(/Назад/i));

        expect(goToCamerasHandler).toHaveBeenCalled();
    });

    test('calls logoutHandler on exit button click', () => {
        const { logoutHandler } = NavigationHandlers.default();

        render(<FaceRecognitionSettingsPage />);

        fireEvent.click(screen.getByLabelText(/Выход/i));

        expect(logoutHandler).toHaveBeenCalled();
    });

    test('handles password input change', () => {
        const { setPassword } = SettingsHandlers.default();

        render(<FaceRecognitionSettingsPage />);

        const input = screen.getByPlaceholderText(/Введите пароль/i);
        fireEvent.change(input, { target: { value: 'newpassword' } });

        expect(setPassword).toHaveBeenCalledWith('newpassword');
    });

    test('calls handleAdminAccess on login button click', () => {
        const { handleAdminAccess } = SettingsHandlers.default();

        render(<FaceRecognitionSettingsPage />);

        fireEvent.click(screen.getByRole('button', { name: /Войти/i }));

        expect(handleAdminAccess).toHaveBeenCalled();
    });
});
