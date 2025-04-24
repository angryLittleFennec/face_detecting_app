import { videoPlayerHandler, downloadCameraLogsHandler } from './CameraInfo';
import { SERVER_URL } from '../../config';

global.fetch = jest.fn(); // Мокаем глобальную функцию fetch

describe('Camera Handlers', () => {
    afterEach(() => {
        jest.clearAllMocks(); // Очищаем моки после каждого теста
    });

    test('videoPlayerHandler should fetch camera data and log it', async () => {
        const cameraId = '12345';
        const mockResponse = { id: cameraId, name: 'Test Camera' };

        fetch.mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce(mockResponse),
        });

        console.log = jest.fn(); // Мокаем console.log

        await videoPlayerHandler(cameraId);

        expect(fetch).toHaveBeenCalledWith(`${SERVER_URL}cameras/${cameraId}`);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(console.log).toHaveBeenCalledWith(mockResponse);
    });

    test('videoPlayerHandler should handle fetch error', async () => {
        const cameraId = '12345';
        const errorMessage = 'Network Error';

        fetch.mockRejectedValueOnce(new Error(errorMessage));
        console.error = jest.fn(); // Мокаем console.error

        await videoPlayerHandler(cameraId);

        expect(fetch).toHaveBeenCalledWith(`${SERVER_URL}cameras/${cameraId}`);
        expect(console.error).toHaveBeenCalledWith(
            'Ошибка при получении информации о камере:',
            expect.any(Error)
        );
    });

    test('downloadCameraLogsHandler should fetch camera logs and log them', async () => {
        const cameraId = '12345';
        const mockResponse = { logs: ['log1', 'log2'] };

        fetch.mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce(mockResponse),
        });

        console.log = jest.fn(); // Мокаем console.log

        await downloadCameraLogsHandler(cameraId);

        expect(fetch).toHaveBeenCalledWith(
            `${SERVER_URL}cameras/camera/${cameraId}/log/download`
        );
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(console.log).toHaveBeenCalledWith(mockResponse);
    });

    test('downloadCameraLogsHandler should handle fetch error', async () => {
        const cameraId = '12345';
        const errorMessage = 'Network Error';

        fetch.mockRejectedValueOnce(new Error(errorMessage));
        console.error = jest.fn(); // Мокаем console.error

        await downloadCameraLogsHandler(cameraId);

        expect(fetch).toHaveBeenCalledWith(
            `${SERVER_URL}cameras/camera/${cameraId}/log/download`
        );
        expect(console.error).toHaveBeenCalledWith(
            'Ошибка при получении информации о камере:',
            expect.any(Error)
        );
    });
});
