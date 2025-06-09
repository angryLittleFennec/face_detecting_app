import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useSelector } from 'react-redux';
import CamerasPage from './CamerasPage';
import * as NavigationHandlers from '../GeneralComponents/NavigationHandlers';
import * as CamerasHandlers from './CamerasHandlers';
import * as DataHandlers from '../DataPages/DataHandlers';

// Мокаем необходимые зависимости
jest.mock('react-redux', () => ({
    useSelector: jest.fn(),
}));

jest.mock('../GeneralComponents/NavigationHandlers');
jest.mock('./CamerasHandlers');
jest.mock('../DataPages/DataHandlers');

describe('CamerasPage', () => {
    const mockGoToProfileHandler = jest.fn();
    const mockGoToSettingsHandler = jest.fn();
    const mockGoToReportsHandler = jest.fn();
    const mockGoToStaffHandler = jest.fn();
    const mockLogoutHandler = jest.fn();

    beforeEach(() => {
        NavigationHandlers.NavigationHandlers.mockReturnValue({
            goToProfileHandler: mockGoToProfileHandler,
            goToSettingsHandler: mockGoToSettingsHandler,
            goToReportsHandler: mockGoToReportsHandler,
            goToStaffHandler: mockGoToStaffHandler,
            logoutHandler: mockLogoutHandler,
        });

        CamerasHandlers.CamerasHandlers.mockReturnValue({
            selectedCamera: null,
            cameras: [],
            loading: false,
            error: null,
            isModalSettingsOpen: false,
            isModalLogsOpen: false,
            openModalLogs: jest.fn(),
            openModalSettings: jest.fn(),
            closeModalLogs: jest.fn(),
            closeModalSettings: jest.fn(),
            handleSelectCamera: jest.fn(),
            handleFetchCameras: jest.fn(),
            handleSelectChange: jest.fn(),
            setSelectedCamera: jest.fn(),
        });

        DataHandlers.DataHandlers.mockReturnValue({
            persons: [],
            selectedPerson: null,
            selectedModel: null,
            handleFetchPersons: jest.fn(),
            handleModelSelectChange: jest.fn(),
            handleStaffDropdownSelectChange: jest.fn(),
        });

        useSelector.mockReturnValue(null); // По умолчанию selectedCameraIndex равен null
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('отображает "Загрузка..." при загрузке', () => {
        CamerasHandlers.CamerasHandlers.mockReturnValueOnce({
            loading: true,
            error: null,
        });

        render(<CamerasPage />);

        expect(screen.getByText(/Загрузка.../i)).toBeInTheDocument();
    });

    test('отображает сообщение об ошибке', () => {
        CamerasHandlers.CamerasHandlers.mockReturnValueOnce({
            loading: false,
            error: 'Ошибка загрузки камер',
        });

        render(<CamerasPage />);

        expect(
            screen.getByText(/Ошибка: Ошибка загрузки камер/i)
        ).toBeInTheDocument();
    });

    test('вызывает обработчики навигации при нажатии кнопок', () => {
        render(<CamerasPage />);

        const profileButton = screen.getByAltText(/Профиль/i);
        const settingsButton = screen.getByAltText(/Настройка камер/i);
        const reportsButton = screen.getByAltText(/Отчетность/i);
        const staffButton = screen.getByAltText(/Сотрудники/i);
        const logoutButton = screen.getByAltText(/Выход/i);

        fireEvent.click(profileButton);
        expect(mockGoToProfileHandler).toHaveBeenCalled();

        fireEvent.click(settingsButton);
        expect(mockGoToSettingsHandler).toHaveBeenCalled();

        fireEvent.click(reportsButton);
        expect(mockGoToReportsHandler).toHaveBeenCalled();

        fireEvent.click(staffButton);
        expect(mockGoToStaffHandler).toHaveBeenCalled();
        fireEvent.click(logoutButton);
        expect(mockLogoutHandler).toHaveBeenCalled();
    });

    test('открывает модальные окна при нажатии кнопок', () => {
        const { openModalSettings } = CamerasHandlers.CamerasHandlers();

        render(<CamerasPage />);

        const statusButton = screen.getByAltText(/Статус камер/i);

        fireEvent.click(statusButton);
        expect(openModalSettings).toHaveBeenCalled();
    });

    test('отображает Dropdown для выбора камеры', () => {
        const camerasMock = [
            { id: '1', name: 'Camera 1' },
            { id: '2', name: 'Camera 2' },
        ];

        CamerasHandlers.CamerasHandlers.mockReturnValueOnce({
            cameras: camerasMock,
            loading: false,
            error: null,
        });

        render(<CamerasPage />);

        const dropdown = screen.getByText(/Выберите камеру/i);
        expect(dropdown).toBeInTheDocument();

        // Проверяем, что камеры отображаются в dropdown
        fireEvent.mouseDown(dropdown);

        camerasMock.forEach((camera) => {
            expect(screen.getByText(camera.name)).toBeInTheDocument();
        });
    });
});
