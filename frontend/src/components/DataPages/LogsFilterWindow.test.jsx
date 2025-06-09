import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LogsFilterWindow from './LogsFilterWindow';
import * as DataHandlers from './DataHandlers';
import * as CamerasHandlers from '../Cameras/CamerasHandlers';

// Мокаем необходимые зависимости
jest.mock('./DataHandlers');
jest.mock('../Cameras/CamerasHandlers');

describe('LogsFilterWindow', () => {
    const mockOnClose = jest.fn();

    beforeEach(() => {
        // Мокаем функции из DataHandlers
        DataHandlers.default.mockReturnValue({
            persons: [],
            files: [],
            selectedPerson: null,
            selectedPersonId: null,
            handleFetchPersons: jest.fn(),
            getStreamId: jest.fn(),
            handleStaffDropdownSelectChange: jest.fn(),
            handleFetchCameraLogsList: jest.fn(),
            handleFetchPersonLogsList: jest.fn(),
            resetSelectedPerson: jest.fn(),
        });

        // Мокаем функции из CamerasHandlers
        CamerasHandlers.default.mockReturnValue({
            loading: false,
            cameras: [],
            streams: [],
            selectedCamera: null,
            selectedCameraId: null,
            handleFetchCameras: jest.fn(),
            handleSelectChange: jest.fn(),
            resetSelectedCamera: jest.fn(),
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('не отображает ничего, если isOpen равно false', () => {
        render(<LogsFilterWindow isOpen={false} onClose={mockOnClose} />);
        expect(
            screen.queryByText(/Фильтрация событий/i)
        ).not.toBeInTheDocument();
    });

    test('отображает "Загрузка..." при загрузке данных', () => {
        CamerasHandlers.default.mockReturnValueOnce({ loading: true });

        render(<LogsFilterWindow isOpen={true} onClose={mockOnClose} />);

        expect(screen.getByText(/Фильтрация событий/i)).toBeInTheDocument();
    });

    test('отображает элементы модального окна', () => {
        render(<LogsFilterWindow isOpen={true} onClose={mockOnClose} />);

        expect(screen.getByText(/Фильтрация событий/i)).toBeInTheDocument();
        expect(screen.getByText(/Выберите камеру/i)).toBeInTheDocument();
        expect(screen.getByText(/Выберите сотрудника/i)).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Сбросить фильтры/i })
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Применить/i })
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Закрыть/i })
        ).toBeInTheDocument();
    });

    test('вызывает onClose при нажатии кнопки "Закрыть"', () => {
        render(<LogsFilterWindow isOpen={true} onClose={mockOnClose} />);

        fireEvent.click(screen.getByRole('button', { name: /Закрыть/i }));
        expect(mockOnClose).toHaveBeenCalled();
    });

    test('вызывает функции сброса фильтров при нажатии кнопки "Сбросить фильтры"', () => {
        const resetSelectedPerson = jest.fn();
        const resetSelectedCamera = jest.fn();

        DataHandlers.default.mockReturnValueOnce({
            ...DataHandlers.default(),
            resetSelectedPerson,
        });

        CamerasHandlers.default.mockReturnValueOnce({
            ...CamerasHandlers.default(),
            resetSelectedCamera,
        });

        render(<LogsFilterWindow isOpen={true} onClose={mockOnClose} />);

        fireEvent.click(
            screen.getByRole('button', { name: /Сбросить фильтры/i })
        );

        expect(resetSelectedPerson).toHaveBeenCalled();
        expect(resetSelectedCamera).toHaveBeenCalled();
    });

    test('вызывает функции для получения логов при нажатии кнопки "Применить"', () => {
        const handleFetchCameraLogsList = jest.fn();
        const handleFetchPersonLogsList = jest.fn();
        const getStreamId = jest.fn().mockReturnValue('streamId');

        DataHandlers.default.mockReturnValueOnce({
            ...DataHandlers.default(),
            handleFetchPersonLogsList,
            getStreamId,
        });

        CamerasHandlers.default.mockReturnValueOnce({
            ...CamerasHandlers.default(),
            handleFetchCameraLogsList,
            selectedCameraId: 'cameraId',
            selectedPersonId: 'personId',
            selectedCamera: true,
            selectedPerson: true,
            streams: [{ id: 'streamId' }],
        });

        render(<LogsFilterWindow isOpen={true} onClose={mockOnClose} />);

        fireEvent.click(screen.getByRole('button', { name: /Применить/i }));

        expect(handleFetchCameraLogsList).toHaveBeenCalledWith('streamId');
        expect(handleFetchPersonLogsList).toHaveBeenCalledWith('streamId');
    });
});
