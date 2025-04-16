import { fetchCameras, addCamera, fetchCameraDetails } from './Api';
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
        expect(fetch).toHaveBeenCalledWith(`${SERVER_URL}/cameras/`);
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
        expect(fetch).toHaveBeenCalledWith(`${SERVER_URL}/cameras/`, {
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
        expect(fetch).toHaveBeenCalledWith(`${SERVER_URL}/cameras/${cameraId}`);
    });

    test('fetchCameraDetails should throw an error on failure', async () => {
        const cameraId = 1;
        fetchMock.mockRejectOnce(new Error('Not Found'));

        await expect(fetchCameraDetails(cameraId)).rejects.toThrow('Not Found');
    });
});
