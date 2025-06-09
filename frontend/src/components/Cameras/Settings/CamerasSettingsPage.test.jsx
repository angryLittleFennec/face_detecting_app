import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CamerasSettingPage from './CamerasSettingPage';
import * as NavigationHandlers from '../../GeneralComponents/NavigationHandlers';
import * as CamerasHandlers from '../CamerasHandlers';
import * as SettingsHandlers from './SettingsHandlers';

jest.mock('../../GeneralComponents/NavigationHandlers');
jest.mock('../CamerasHandlers');
jest.mock('./SettingsHandlers');

describe('CamerasSettingPage', () => {
    const mockGoToCamerasHandler = jest.fn();
    const mockLogoutHandler = jest.fn();

    beforeEach(() => {
        NavigationHandlers.NavigationHandlers.mockReturnValue({
            goToCamerasHandler: mockGoToCamerasHandler,
            logoutHandler: mockLogoutHandler,
        });

        CamerasHandlers.CamerasHandlers.mockReturnValue({
            selectedCamera: '',
            selectedCameraIndex: 0,
            cameras: [],
            loading: false,
            error: null,
            newCamera: {},
            newCameraUpdate: {},
            setNewCamera: jest.fn(),
            setNewCameraUpdate: jest.fn(),
            handleAddCamera: jest.fn(),
            handleUpdateCamera: jest.fn(),
            handleDeleteCamera: jest.fn(),
            handleFetchCameras: jest.fn(),
            handleSelectChange: jest.fn(),
        });

        SettingsHandlers.SettingsHandlers.mockReturnValue({
            password: '',
            isAdmin: false,
            setPassword: jest.fn(),
            handleAdminAccess: jest.fn(),
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('отображает "Загрузка..." при загрузке', () => {
        CamerasHandlers.CamerasHandlers.mockReturnValueOnce({
            loading: true,
            error: null,
        });

        render(<CamerasSettingPage />);

        expect(screen.getByText(/Загрузка.../i)).toBeInTheDocument();
    });

    test('отображает сообщение об ошибке', () => {
        CamerasHandlers.CamerasHandlers.mockReturnValueOnce({
            loading: false,
            error: 'Ошибка загрузки камер',
        });

        render(<CamerasSettingPage />);

        expect(
            screen.getByText(/Ошибка: Ошибка загрузки камер/i)
        ).toBeInTheDocument();
    });

    test('отображает форму для ввода пароля, если не администратор', () => {
        render(<CamerasSettingPage />);

        expect(
            screen.getByPlaceholderText(/Введите пароль/i)
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                /Доступ к настройкам камер осуществляется по паролю/i
            )
        ).toBeInTheDocument();
    });

    test('отображает элементы управления для администратора', () => {
        SettingsHandlers.SettingsHandlers.mockReturnValueOnce({
            password: '',
            isAdmin: true,
            setPassword: jest.fn(),
            handleAdminAccess: jest.fn(),
        });

        render(<CamerasSettingPage />);

        expect(screen.getByText(/Добавление камер/i)).toBeInTheDocument();
        expect(screen.getByText(/Изменение камер/i)).toBeInTheDocument();
    });

    test('вызывает goToCamerasHandler при нажатии кнопки "Назад"', () => {
        render(<CamerasSettingPage />);

        const backButton = screen.getByAltText(/Назад/i);
        fireEvent.click(backButton);

        expect(mockGoToCamerasHandler).toHaveBeenCalled();
    });

    test('вызывает logoutHandler при нажатии кнопки "Выход"', () => {
        render(<CamerasSettingPage />);

        const logoutButton = screen.getByAltText(/Выход/i);
        fireEvent.click(logoutButton);

        expect(mockLogoutHandler).toHaveBeenCalled();
    });
    test('вызывает handleAdminAccess при вводе пароля и нажатии кнопки', () => {
        SettingsHandlers.SettingsHandlers.mockReturnValueOnce({
            password: '',
            isAdmin: false,
            setPassword: jest.fn((value) => value),
            handleAdminAccess: jest.fn(),
        });

        render(<CamerasSettingPage />);

        const passwordInput = screen.getByPlaceholderText(/Введите пароль/i);
        fireEvent.change(passwordInput, { target: { value: 'testpassword' } });

        const loginButton = screen.getByText(/Войти/i);
        fireEvent.click(loginButton);

        expect(
            SettingsHandlers.SettingsHandlers().handleAdminAccess
        ).toHaveBeenCalled();
    });

    test('вызывает handleAddCamera при добавлении камеры', () => {
        SettingsHandlers.SettingsHandlers.mockReturnValueOnce({
            password: '',
            isAdmin: true,
            setPassword: jest.fn(),
            handleAdminAccess: jest.fn(),
        });

        CamerasHandlers.CamerasHandlers.mockReturnValueOnce({
            selectedCamera: '',
            selectedCameraIndex: 0,
            cameras: [],
            loading: false,
            error: null,
            newCamera: {},
            newCameraUpdate: {},
            setNewCamera: jest.fn(),
            setNewCameraUpdate: jest.fn(),
            handleAddCamera: jest.fn(),
            handleUpdateCamera: jest.fn(),
            handleDeleteCamera: jest.fn(),
            handleFetchCameras: jest.fn(),
            handleSelectChange: jest.fn(),
        });

        render(<CamerasSettingPage />);

        const addCameraButton = screen.getByText(/Добавить камеру/i);
        fireEvent.click(addCameraButton);

        expect(
            CamerasHandlers.CamerasHandlers().handleAddCamera
        ).toHaveBeenCalled();
    });
});
