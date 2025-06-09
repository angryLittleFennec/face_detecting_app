import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useSelector } from 'react-redux';
import CamerasContainer from './CamerasContainer';
import CamerasHandlers from './CamerasHandlers';
import DataHandlers from '../DataPages/DataHandlers';

// Мокаем нужные функции и данные
jest.mock('./CamerasHandlers');
jest.mock('../DataPages/DataHandlers');

describe('CamerasContainer', () => {
    const mockHandleFetchCameras = jest.fn();
    const mockHandleSelectCamera = jest.fn();
    const mockGetStreamUrl = jest.fn();

    beforeEach(() => {
        // Настраиваем моки перед каждым тестом
        CamerasHandlers.mockReturnValue({
            loading: false,
            error: null,
            streams: [],
            handleFetchCameras: mockHandleFetchCameras,
            handleSelectCamera: mockHandleSelectCamera,
        });

        DataHandlers.mockReturnValue({
            getStreamUrl: mockGetStreamUrl,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('показывает сообщение о загрузке, если данные загружаются', () => {
        CamerasHandlers.mockReturnValue({
            loading: true,
            error: null,
            streams: [],
            handleFetchCameras: mockHandleFetchCameras,
            handleSelectCamera: mockHandleSelectCamera,
        });

        render(
            <CamerasContainer
                currentCameras={[]}
                camerasLocation="first"
                startIndex={0}
            />
        );

        expect(screen.getByText(/Загрузка.../)).toBeInTheDocument();
    });

    test('показывает сообщение об ошибке, если есть ошибка', () => {
        CamerasHandlers.mockReturnValue({
            loading: false,
            error: 'Ошибка загрузки',
            streams: [],
            handleFetchCameras: mockHandleFetchCameras,
            handleSelectCamera: mockHandleSelectCamera,
        });

        render(
            <CamerasContainer
                currentCameras={[]}
                camerasLocation="first"
                startIndex={0}
            />
        );

        expect(screen.getByText(/Ошибка: Ошибка загрузки/)).toBeInTheDocument();
    });

    test('показывает сообщение о том, что камеры не найдены, если нет камер', () => {
        render(
            <CamerasContainer
                currentCameras={[]}
                camerasLocation="first"
                startIndex={0}
            />
        );

        expect(screen.getByText(/Камеры не найдены/)).toBeInTheDocument();
    });

    test('отображает камеры и позволяет выбрать камеру', () => {
        const mockCameras = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const mockSelectedCameraIndex = 0;

        useSelector.mockReturnValue(mockSelectedCameraIndex);
        mockGetStreamUrl.mockReturnValue('mockStreamUrl');

        render(
            <CamerasContainer
                currentCameras={mockCameras}
                camerasLocation="first"
                startIndex={0}
            />
        );

        const cameraElements = screen.getAllByRole('button'); // предполагаем, что камеры отображаются как кнопки
        expect(cameraElements.length).toBe(3); // ожидаем 3 камеры

        fireEvent.click(cameraElements[0]); // выбираем первую камеру
        expect(mockHandleSelectCamera).toHaveBeenCalledWith(0); // проверяем вызов функции выбора камеры
    });

    test('отображает камеры в разных локациях', () => {
        const mockCameras = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const mockSelectedCameraIndex = 1;

        useSelector.mockReturnValue(mockSelectedCameraIndex);
        mockGetStreamUrl.mockReturnValue('mockStreamUrl');

        render(
            <CamerasContainer
                currentCameras={mockCameras}
                camerasLocation="second"
                startIndex={0}
            />
        );

        const cameraElements = screen.getAllByRole('button');
        expect(cameraElements.length).toBe(3); // ожидаем 3 камеры

        cameraElements.forEach((cameraElement, index) => {
            expect(cameraElement).toHaveStyle(
                `border: ${index === 1 ? '2px solid blue' : 'none'}`
            ); // проверяем стиль границы
        });
    });
});
