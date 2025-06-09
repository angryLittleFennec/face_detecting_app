import { renderHook, act } from '@testing-library/react-hooks';
import { useDispatch } from 'react-redux';
import CamerasHandlers from './CamerasHandlers';
import * as Api from './Api'; // Импортируем функции API
import DataHandlers from '../DataPages/DataHandlers';
import { setSelectedCameraIndexRedux } from '../../actions';

jest.mock('react-redux', () => ({
    useDispatch: jest.fn(),
}));

jest.mock('./Api', () => ({
    addStream: jest.fn(),
    deleteStream: jest.fn(),
    getAllStreams: jest.fn(),
}));

jest.mock('../DataPages/DataHandlers', () => jest.fn());

describe('CamerasHandlers', () => {
    const mockDispatch = jest.fn();
    const initialCameras = [
        {
            id: 1,
            name: 'Camera 1',
            url: 'http://camera1.url',
            description: 'Description 1',
            is_active: true,
        },
        {
            id: 2,
            name: 'Camera 2',
            url: 'http://camera2.url',
            description: 'Description 2',
            is_active: false,
        },
    ];

    beforeEach(() => {
        useDispatch.mockReturnValue(mockDispatch);
        DataHandlers.mockReturnValue({
            handleFetchCameraLogsList: jest.fn(),
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('добавляет новый стрим и сбрасывает состояние', async () => {
        const { result } = renderHook(() => CamerasHandlers(initialCameras));

        const newCamera = { name: 'New Stream', camera_id: 1 };

        Api.addStream.mockResolvedValueOnce({});
        Api.getAllStreams.mockResolvedValueOnce({ processors: [] });

        await act(async () => {
            result.current.handleAddStream(newCamera);
        });

        expect(Api.addStream).toHaveBeenCalledWith(newCamera);
        expect(result.current.newStream).toEqual({ name: '', camera_id: null }); // Проверяем сброс состояния
    });

    test('обрабатывает ошибку при добавлении стрима', async () => {
        const { result } = renderHook(() => CamerasHandlers(initialCameras));

        const newCamera = { name: 'New Stream', camera_id: 1 };

        Api.addStream.mockRejectedValueOnce(new Error('Ошибка добавления'));

        await act(async () => {
            await result.current.handleAddStream(newCamera);
        });

        expect(result.current.error).toBe(
            'Ошибка при добавлении стрима: Ошибка добавления'
        );
    });

    test('получает стримы и обновляет состояние', async () => {
        const { result } = renderHook(() => CamerasHandlers(initialCameras));

        const mockStreams = [
            { id: 1, name: 'Stream 1' },
            { id: 2, name: 'Stream 2' },
        ];

        Api.getAllStreams.mockResolvedValueOnce({ processors: mockStreams });

        await act(async () => {
            await result.current.handleFetchStreams();
        });

        expect(Api.getAllStreams).toHaveBeenCalled();
        expect(result.current.streams).toEqual(mockStreams); // Проверяем обновление состояния
    });

    test('обрабатывает ошибку при получении стримов', async () => {
        const { result } = renderHook(() => CamerasHandlers(initialCameras));

        Api.getAllStreams.mockRejectedValueOnce(
            new Error('Ошибка получения стримов')
        );

        await act(async () => {
            await result.current.handleFetchStreams();
        });

        expect(result.current.error).toBe(
            'Ошибка при получении стримов: Ошибка получения стримов'
        );
    });

    test('удаляет стрим и обновляет состояние', async () => {
        const { result } = renderHook(() => CamerasHandlers(initialCameras));

        const streamIdToDelete = 1;

        Api.deleteStream.mockResolvedValueOnce({});

        await act(async () => {
            await result.current.handleDeleteStream(streamIdToDelete);
        });

        expect(Api.deleteStream).toHaveBeenCalledWith(streamIdToDelete);
        expect(result.current.streams).not.toContainEqual(
            expect.objectContaining({ id: streamIdToDelete })
        );
    });

    test('обрабатывает ошибку при удалении стрима', async () => {
        const { result } = renderHook(() => CamerasHandlers(initialCameras));

        const streamIdToDelete = 1;

        Api.deleteStream.mockRejectedValueOnce(new Error('Ошибка удаления'));

        await act(async () => {
            await result.current.handleDeleteStream(streamIdToDelete);
        });

        expect(result.current.error).toBe(
            'Ошибка при удалении стрима: Ошибка удаления'
        );
    });

    test('изменяет выбранную камеру и обновляет индекс', () => {
        const { result } = renderHook(() => CamerasHandlers(initialCameras));

        const event = { target: { value: 'Camera 1' } };

        act(() => {
            result.current.handleSelectChange(event);
        });

        expect(result.current.selectedCamera).toBe('Camera 1');
        expect(mockDispatch).toHaveBeenCalledWith(
            setSelectedCameraIndexRedux(0)
        ); // Проверяем вызов Redux
    });
});
