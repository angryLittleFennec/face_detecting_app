import {
    fetchCameras,
    addCamera,
    fetchCameraDetails,
    loginUser,
    deleteCamera,
    updateCamera,
    downloadCameraLogs,
    fetchStream,
    fetchPersons,
    addPerson,
    addFace,
} from './Api';
import fetchMock from 'jest-fetch-mock';
import { SERVER_URL } from '../../config';

beforeEach(() => {
    fetchMock.resetMocks();
});

beforeAll(() => {
    fetchMock.enableMocks();
});

describe('API functions', () => {
    test('fetchCameras should return cameras data', async () => {
        const mockCameras = [
            { id: 1, name: 'Camera 1' },
            { id: 2, name: 'Camera 2' },
        ];
        fetchMock.mockResponseOnce(JSON.stringify(mockCameras));

        const cameras = await fetchCameras();
        expect(cameras).toEqual(mockCameras);
        expect(fetch).toHaveBeenCalledWith(`${SERVER_URL}cameras/`);
    });

    test('fetchCameras should throw an error on failure', async () => {
        fetchMock.mockRejectOnce(new Error('HTTP error! status: 500'));

        await expect(fetchCameras()).rejects.toThrow('HTTP error! status: 500');
    });

    test('addCamera should return added camera data', async () => {
        const newCamera = { name: 'New Camera' };
        const mockResponse = { id: 3, name: 'New Camera' };
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const response = await addCamera(newCamera);
        expect(response).toEqual(mockResponse);
        expect(fetch).toHaveBeenCalledWith(`${SERVER_URL}cameras/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newCamera),
        });
    });

    test('addCamera should throw an error on failure', async () => {
        fetchMock.mockRejectOnce(new Error('Bad Request'));

        await expect(addCamera({})).rejects.toThrow('Bad Request');
    });

    test('fetchCameraDetails should return camera details', async () => {
        const cameraId = 1;
        const mockDetails = { id: 1, name: 'Camera 1' };
        fetchMock.mockResponseOnce(JSON.stringify(mockDetails));

        const details = await fetchCameraDetails(cameraId);
        expect(details).toEqual(mockDetails);
        expect(fetch).toHaveBeenCalledWith(`${SERVER_URL}cameras/${cameraId}`);
    });

    test('fetchCameraDetails should throw an error on failure', async () => {
        const cameraId = 1;
        fetchMock.mockRejectOnce(new Error('Not Found'));

        await expect(fetchCameraDetails(cameraId)).rejects.toThrow('Not Found');
    });

    test('loginUser - success', async () => {
        const user = { username: 'test', password: 'test' };
        fetch.mockResponseOnce(JSON.stringify({ token: '12345' }));

        const response = await loginUser(user);
        expect(response).toEqual({ token: '12345' });
        expect(fetch).toHaveBeenCalledWith(
            `${SERVER_URL}/login`,
            expect.any(Object)
        );
    });

    test('loginUser - failure', async () => {
        const user = { username: 'test', password: 'test' };
        fetch.mockResponseOnce('', { status: 401 });

        await expect(loginUser(user)).rejects.toThrow(
            'Ошибка авторизации: 401'
        );
    });

    test('deleteCamera - success', async () => {
        const cameraId = 'camera123';
        fetch.mockResponseOnce(JSON.stringify({ message: 'Camera deleted' }));

        const response = await deleteCamera(cameraId);
        expect(response).toEqual({ message: 'Camera deleted' });
        expect(fetch).toHaveBeenCalledWith(
            `${SERVER_URL}cameras/${cameraId}`,
            expect.any(Object)
        );
    });

    test('deleteCamera - failure', async () => {
        const cameraId = 'camera123';
        fetch.mockResponseOnce('', { status: 404 });

        await expect(deleteCamera(cameraId)).rejects.toThrow(
            'Ошибка при удалении камеры: 404'
        );
    });

    test('updateCamera - success', async () => {
        const cameraId = 'camera123';
        const updatedCameraData = { name: 'New Camera' };
        fetch.mockResponseOnce(JSON.stringify({ message: 'Camera updated' }));

        const response = await updateCamera(cameraId, updatedCameraData);
        expect(response).toEqual({ message: 'Camera updated' });
        expect(fetch).toHaveBeenCalledWith(
            `${SERVER_URL}cameras/${cameraId}`,
            expect.any(Object)
        );
    });

    test('updateCamera - failure', async () => {
        const cameraId = 'camera123';
        const updatedCameraData = { name: 'New Camera' };
        fetch.mockResponseOnce('', { status: 500 });

        await expect(updateCamera(cameraId, updatedCameraData)).rejects.toThrow(
            'Ошибка при обновлении камеры: Internal Server Error'
        );
    });

    test('downloadCameraLogs - success', async () => {
        const cameraId = 'camera123';
        fetch.mockResponseOnce(JSON.stringify({ logs: [] }));

        const response = await downloadCameraLogs(cameraId);
        expect(response).toEqual({ logs: [] });
        expect(fetch).toHaveBeenCalledWith(
            `${SERVER_URL}cameras/camera/${cameraId}/log/download`,
            expect.any(Object)
        );
    });

    test('downloadCameraLogs - failure', async () => {
        const cameraId = 'camera123';
        fetch.mockResponseOnce('', { status: 403 });

        await expect(downloadCameraLogs(cameraId)).rejects.toThrow(
            'Ошибка при получении логов камеры: 403'
        );
    });

    test('fetchStream - success', async () => {
        const cameraId = 'camera123';
        fetch.mockResponseOnce(
            JSON.stringify({ streamUrl: 'http://stream.url' })
        );

        const response = await fetchStream(cameraId);
        expect(response).toEqual({ streamUrl: 'http://stream.url' });
        expect(fetch).toHaveBeenCalledWith(
            `${SERVER_URL}stream/${cameraId}`,
            expect.any(Object)
        );
    });

    test('fetchStream - failure', async () => {
        const cameraId = 'camera123';
        fetch.mockResponseOnce('', { status: 404 });

        await expect(fetchStream(cameraId)).rejects.toThrow(
            'Ошибка при получении видео с камеры camera123: 404'
        );
    });

    test('fetchPersons - success', async () => {
        fetch.mockResponseOnce(JSON.stringify([{ id: 1, name: 'John Doe' }]));

        const response = await fetchPersons();
        expect(response).toEqual([{ id: 1, name: 'John Doe' }]);
        expect(fetch).toHaveBeenCalledWith(
            `${SERVER_URL}persons/`,
            expect.any(Object)
        );
    });

    test('fetchPersons - failure', async () => {
        fetch.mockResponseOnce('', { status: 500 });

        await expect(fetchPersons()).rejects.toThrow(
            'Ошибка при получении списка сотрудников: 500'
        );
    });

    test('addPerson - success', async () => {
        const newPerson = { name: 'Jane Doe' };
        fetch.mockResponseOnce(JSON.stringify({ id: 2, name: 'Jane Doe' }));

        const response = await addPerson(newPerson);
        expect(response).toEqual({ id: 2, name: 'Jane Doe' });
        expect(fetch).toHaveBeenCalledWith(
            `${SERVER_URL}persons/`,
            expect.any(Object)
        );
    });

    test('addPerson - failure', async () => {
        const newPerson = { name: 'Jane Doe' };
        fetch.mockResponseOnce('', { status: 400 });

        await expect(addPerson(newPerson)).rejects.toThrow(
            'Ошибка при добавлении сотрудника: 400'
        );
    });

    test('addFace - success', async () => {
        const personId = 'person123';
        const newFace = { imageUrl: 'http://face.url' };
        fetch.mockResponseOnce(JSON.stringify({ message: 'Face added' }));

        const response = await addFace(personId, newFace);
        expect(response).toEqual({ message: 'Face added' });
        expect(fetch).toHaveBeenCalledWith(
            `${SERVER_URL}faces/upload/${personId}`,
            expect.any(Object)
        );
    });

    test('addFace - failure', async () => {
        const personId = 'person123';
        const newFace = { imageUrl: 'http://face.url' };
        fetch.mockResponseOnce('', { status: 500 });

        await expect(addFace(personId, newFace)).rejects.toThrow(
            'Ошибка при добавлении лиц: 500'
        );
    });
});
