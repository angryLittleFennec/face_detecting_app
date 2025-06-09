import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useParams } from 'react-router';
import CameraPage from './CameraPage';
import * as NavigationHandlers from '../GeneralComponents/NavigationHandlers';
import * as CamerasHandlers from './CamerasHandlers';
import * as DataHandlers from '../DataPages/DataHandlers';

jest.mock('react-router', () => ({
    useParams: jest.fn(),
}));

jest.mock('../GeneralComponents/NavigationHandlers');
jest.mock('./CamerasHandlers');
jest.mock('../DataPages/DataHandlers');

describe('CameraPage', () => {
    const mockGoToCamerasHandler = jest.fn();

    beforeEach(() => {
        NavigationHandlers.NavigationHandlers.mockReturnValue({
            goToCamerasHandler: mockGoToCamerasHandler,
            logoutHandler: jest.fn(),
        });

        CamerasHandlers.CamerasHandlers.mockReturnValue({
            cameras: [{ id: '1', name: 'Camera 1' }],
            streams: [],
            cameraInfo: {},
            loading: false,
            error: null,
            isModalLogsOpen: false,
            openModalLogs: jest.fn(),
            closeModalLogs: jest.fn(),
            handleFetchCameras: jest.fn(),
            handleFetchCameraDetails: jest.fn(),
        });

        DataHandlers.DataHandlers.mockReturnValue({
            persons: [],
            selectedPerson: null,
            selectedModel: null,
            handleFetchPersons: jest.fn(),
            handleStaffDropdownSelectChange: jest.fn(),
            handleModelSelectChange: jest.fn(),
            handleDownloadCameraLogs: jest.fn(),
            getStreamId: jest.fn(),
            getStreamUrl: jest
                .fn()
                .mockReturnValue('http://example.com/stream'),
        });

        useParams.mockReturnValue({ id: '0' });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('отображает "Загрузка..." при загрузке', () => {
        CamerasHandlers.CamerasHandlers.mockReturnValueOnce({
            loading: true,
            error: null,
        });

        render(<CameraPage />);

        expect(screen.getByText(/Загрузка.../i)).toBeInTheDocument();
    });

    test('отображает сообщение об ошибке', () => {
        CamerasHandlers.CamerasHandlers.mockReturnValueOnce({
            loading: false,
            error: 'Ошибка загрузки камеры',
        });

        render(<CameraPage />);

        expect(
            screen.getByText(/Ошибка: Ошибка загрузки камеры/i)
        ).toBeInTheDocument();
    });

    test('отображает информацию о камере', () => {
        render(<CameraPage />);

        expect(screen.getByText(/Camera 1/i)).toBeInTheDocument();
    });

    test('вызывает goToCamerasHandler при нажатии кнопки "Назад"', () => {
        render(<CameraPage />);

        const backButton = screen.getByAltText(/Назад/i);
        fireEvent.click(backButton);

        expect(mockGoToCamerasHandler).toHaveBeenCalled();
    });

    test('отрисовывает прямоугольник на канвасе', () => {
        render(<CameraPage />);

        const canvas = screen.getByRole('img'); // измените на правильный роль для canvas
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });
        fireEvent.mouseUp(canvas);

        // Здесь вы можете проверить состояние или поведение после рисования
    });

    test('переключает режим рисования', () => {
        render(<CameraPage />);

        const canvas = screen.getByRole('img'); // измените на правильный роль для canvas
        const drawingButton = screen.getByText(/Рисовать/i); // замените на текст кнопки переключения режима рисования

        // Проверяем, что режим рисования выключен по умолчанию
        expect(canvas).not.toHaveAttribute('style', 'position: absolute;');

        fireEvent.click(drawingButton); // переключаем режим рисования

        // Проверяем, что режим рисования включен
        expect(canvas).toHaveAttribute('style', 'position: absolute;');
    });
});
