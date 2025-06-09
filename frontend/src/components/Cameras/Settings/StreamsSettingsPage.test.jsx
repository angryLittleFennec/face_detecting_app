import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StreamsSettingsPage from './StreamsSettingsPage';
import * as CamerasHandlers from '../CamerasHandlers';
import * as SettingsHandlers from './SettingsHandlers';
import * as NavigationHandlers from '../../GeneralComponents/NavigationHandlers';

jest.mock('../CamerasHandlers');
jest.mock('./SettingsHandlers');
jest.mock('../../GeneralComponents/NavigationHandlers');

describe('StreamsSettingsPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should display loading message when loading is true', () => {
        CamerasHandlers.mockReturnValue({
            loading: true,
            error: null,
            handleFetchStreams: jest.fn(),
        });
        render(<StreamsSettingsPage />);

        expect(screen.getByText(/Загрузка.../i)).toBeInTheDocument();
    });

    it('should display error message when there is an error', () => {
        CamerasHandlers.mockReturnValue({
            loading: false,
            error: 'Ошибка загрузки',
            handleFetchStreams: jest.fn(),
        });
        render(<StreamsSettingsPage />);

        expect(
            screen.getByText(/Ошибка: Ошибка загрузки/i)
        ).toBeInTheDocument();
    });

    it('should display password input when not admin', () => {
        SettingsHandlers.mockReturnValue({
            isAdmin: false,
            password: '',
            setPassword: jest.fn(),
            handleAdminAccess: jest.fn(),
        });
        render(<StreamsSettingsPage />);

        expect(
            screen.getByPlaceholderText(/Введите пароль/i)
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Войти/i })
        ).toBeInTheDocument();
    });

    it('should call handleAdminAccess when login button is clicked', () => {
        const handleAdminAccessMock = jest.fn();
        SettingsHandlers.mockReturnValue({
            isAdmin: false,
            password: '',
            setPassword: jest.fn(),
            handleAdminAccess: handleAdminAccessMock,
        });
        render(<StreamsSettingsPage />);

        fireEvent.change(screen.getByPlaceholderText(/Введите пароль/i), {
            target: { value: 'correct_password' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Войти/i }));

        expect(handleAdminAccessMock).toHaveBeenCalled();
    });

    it('should display stream settings when admin', () => {
        SettingsHandlers.mockReturnValue({
            isAdmin: true,
            password: '',
            setPassword: jest.fn(),
            handleAdminAccess: jest.fn(),
        });

        CamerasHandlers.mockReturnValue({
            selectedStream: '',
            selectedStreamIndex: 0,
            streams: [{ name: 'Stream 1' }, { name: 'Stream 2' }],
            newStream: { name: '', camera_id: '' },
            setNewStream: jest.fn(),
            handleAddStream: jest.fn(),
            handleSelectStreamChange: jest.fn(),
        });

        render(<StreamsSettingsPage />);

        expect(screen.getByText(/Добавление видеопотока/i)).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText(/Название стрима/i)
        ).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText(/ID соответствующей камеры/i)
        ).toBeInTheDocument();

        // Проверка на наличие опций в select
        const selectElement = screen.getByRole('combobox');
        expect(selectElement).toBeInTheDocument();
        expect(screen.getByText(/Выберите видеопоток/i)).toBeInTheDocument();
    });

    it('should call handleDeleteStream when delete button is clicked', () => {
        const handleDeleteStreamMock = jest.fn();

        SettingsHandlers.mockReturnValue({
            isAdmin: true,
            password: '',
            setPassword: jest.fn(),
            handleAdminAccess: jest.fn(),
        });

        CamerasHandlers.mockReturnValue({
            selectedStream: 'Stream 1',
            selectedStreamIndex: 0,
            streams: [
                { name: 'Stream 1', camera_id: '1' },
                { name: 'Stream 2', camera_id: '2' },
            ],
            newStream: { name: '', camera_id: '' },
            setNewStream: jest.fn(),
            handleAddStream: jest.fn(),
            handleSelectStreamChange: jest.fn(),
            handleDeleteStream: handleDeleteStreamMock,
        });

        render(<StreamsSettingsPage />);

        fireEvent.click(
            screen.getByRole('button', { name: /Удалить видеопоток/i })
        );

        expect(handleDeleteStreamMock).toHaveBeenCalledWith('1'); // Проверяем, что вызвано с правильным ID
    });
});
