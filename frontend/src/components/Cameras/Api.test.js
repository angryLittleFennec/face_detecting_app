// import {
//     getCookie,
//     loginUser,
//     registerUser,
//     fetchCameras,
//     addCamera,
//     fetchCameraDetails,
//     deleteCamera,
//     updateCamera,
//     downloadCameraLogs,
//     addStream,
//     getStream,
//     getAllStreams,
//     deleteStream,
//     fetchPersons,
//     addPerson,
//     fetchPerson,
//     deletePerson,
//     updatePerson,
//     fetchFaces,
//     addFace,
// } from './Api';
// import fetchMock from 'jest-fetch-mock';
// import { SERVER_URL } from '../../config';

// jest.mock('./Api');
// global.fetch = jest.fn(); // Мокаем глобальную функцию fetch

// beforeAll(() => {
//     fetchMock.enableMocks();
// });

// describe('API functions', () => {
//     const mockToken = 'mockAuthToken';

//     beforeEach(() => {
//         getCookie.mockReturnValue(mockToken); // Возвращаем токен при каждом вызове getCookie
//         fetch.resetMocks();
//     });

//     test('loginUser - success', async () => {
//         const user = {
//             grant_type: 'password',
//             username: 'test',
//             password: 'test',
//         };
//         const mockResponse = { token: '12345' };

//         fetch.mockResponseOnce(JSON.stringify(mockResponse), { status: 200 });

//         const response = await loginUser(user);
//         expect(response).toEqual(mockResponse);
//         expect(fetch).toHaveBeenCalledWith(
//             `${SERVER_URL}auth/token`,
//             expect.objectContaining({
//                 method: 'POST',
//                 headers: expect.objectContaining({
//                     Accept: 'application/json',
//                     'Content-Type': 'application/x-www-form-urlencoded',
//                 }),
//                 body: expect.stringContaining('grant_type=password'),
//             })
//         );
//     });

//     test('loginUser - failure', async () => {
//         const user = { username: 'test', password: 'test' };
//         fetch.mockResponseOnce('', { status: 401 });

//         await expect(loginUser(user)).rejects.toThrow(
//             'Ошибка авторизации: 401'
//         );
//     });

//     test('registerUser - success', async () => {
//         const user = {
//             email: 'test@test.com',
//             username: 'test',
//             password: 'test',
//         };
//         fetch.mockResponseOnce(JSON.stringify({ token: '12345' }));

//         const response = await registerUser(user);
//         expect(response).toEqual({ token: '12345' });
//         expect(fetch).toHaveBeenCalledWith(
//             `${SERVER_URL}/register`,
//             expect.any(Object)
//         );
//     });

//     test('registerUser - failure', async () => {
//         const user = {
//             email: 'test@test.com',
//             username: 'test',
//             password: 'test',
//         };
//         fetch.mockResponseOnce('', { status: 401 });

//         await expect(registerUser(user)).rejects.toThrow(
//             'Ошибка регистрации: 401'
//         );
//     });

//     test('fetchCameras should return cameras data', async () => {
//         const mockCameras = [
//             { id: 1, name: 'Camera 1' },
//             { id: 2, name: 'Camera 2' },
//         ];
//         fetchMock.mockResponseOnce(JSON.stringify(mockCameras));

//         const cameras = await fetchCameras();
//         expect(cameras).toEqual(mockCameras);
//         expect(fetch).toHaveBeenCalledWith(`${SERVER_URL}cameras/`);
//     });

//     test('fetchCameras should throw an error on failure', async () => {
//         fetchMock.mockRejectOnce(new Error('HTTP error! status: 500'));

//         await expect(fetchCameras()).rejects.toThrow('HTTP error! status: 500');
//     });

//     test('addCamera should return added camera data', async () => {
//         const newCamera = { name: 'New Camera' };
//         const mockResponse = { id: 3, name: 'New Camera' };
//         fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

//         const response = await addCamera(newCamera);
//         expect(response).toEqual(mockResponse);
//         expect(fetch).toHaveBeenCalledWith(`${SERVER_URL}cameras/`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify(newCamera),
//         });
//     });

//     test('addCamera should throw an error on failure', async () => {
//         fetchMock.mockRejectOnce(new Error('Bad Request'));

//         await expect(addCamera({})).rejects.toThrow('Bad Request');
//     });

//     test('fetchCameraDetails should return camera details', async () => {
//         const cameraId = 1;
//         const mockDetails = { id: 1, name: 'Camera 1' };
//         fetchMock.mockResponseOnce(JSON.stringify(mockDetails));

//         const details = await fetchCameraDetails(cameraId);
//         expect(details).toEqual(mockDetails);
//         expect(fetch).toHaveBeenCalledWith(`${SERVER_URL}cameras/${cameraId}`);
//     });

//     test('fetchCameraDetails should throw an error on failure', async () => {
//         const cameraId = 1;
//         fetchMock.mockRejectOnce(new Error('Not Found'));

//         await expect(fetchCameraDetails(cameraId)).rejects.toThrow('Not Found');
//     });

//     test('deleteCamera - success', async () => {
//         const cameraId = 'camera123';
//         fetch.mockResponseOnce(JSON.stringify({ message: 'Camera deleted' }));

//         const response = await deleteCamera(cameraId);
//         expect(response).toEqual({ message: 'Camera deleted' });
//         expect(fetch).toHaveBeenCalledWith(
//             `${SERVER_URL}cameras/${cameraId}`,
//             expect.any(Object)
//         );
//     });

//     test('deleteCamera - failure', async () => {
//         const cameraId = 'camera123';
//         fetch.mockResponseOnce('', { status: 404 });

//         await expect(deleteCamera(cameraId)).rejects.toThrow(
//             'Ошибка при удалении камеры: 404'
//         );
//     });

//     test('updateCamera - success', async () => {
//         const cameraId = 'camera123';
//         const updatedCameraData = { name: 'New Camera' };
//         fetch.mockResponseOnce(JSON.stringify({ message: 'Camera updated' }));

//         const response = await updateCamera(cameraId, updatedCameraData);
//         expect(response).toEqual({ message: 'Camera updated' });
//         expect(fetch).toHaveBeenCalledWith(
//             `${SERVER_URL}cameras/${cameraId}`,
//             expect.any(Object)
//         );
//     });

//     test('updateCamera - failure', async () => {
//         const cameraId = 'camera123';
//         const updatedCameraData = { name: 'New Camera' };
//         fetch.mockResponseOnce('', { status: 500 });

//         await expect(updateCamera(cameraId, updatedCameraData)).rejects.toThrow(
//             'Ошибка при обновлении камеры: Internal Server Error'
//         );
//     });

//     test('downloadCameraLogs - success', async () => {
//         const cameraId = 'camera123';
//         fetch.mockResponseOnce(JSON.stringify({ logs: [] }));

//         const response = await downloadCameraLogs(cameraId);
//         expect(response).toEqual({ logs: [] });
//         expect(fetch).toHaveBeenCalledWith(
//             `${SERVER_URL}cameras/camera/${cameraId}/log/download`,
//             expect.any(Object)
//         );
//     });

//     test('downloadCameraLogs - failure', async () => {
//         const cameraId = 'camera123';
//         fetch.mockResponseOnce('', { status: 403 });

//         await expect(downloadCameraLogs(cameraId)).rejects.toThrow(
//             'Ошибка при получении логов камеры: 403'
//         );
//     });

//     test('addStream should successfully add a stream', async () => {
//         const newStream = {
//             name: 'string',
//             camera_id: 0,
//         };
//         fetch.mockResolvedValueOnce({
//             ok: true,
//             json: jest.fn().mockResolvedValueOnce({
//                 status: 'string',
//                 message: 'string',
//                 name: 'string',
//                 release_name: 'string',
//                 camera_id: 0,
//                 input_stream: 'string',
//                 output_stream: 'string',
//             }),
//         });

//         const result = await addStream(newStream);

//         expect(fetch).toHaveBeenCalledWith(
//             `${SERVER_URL}kubernetes/stream-processor`,
//             expect.objectContaining({
//                 method: 'POST',
//                 headers: expect.objectContaining({
//                     Authorization: `Bearer ${mockToken}`,
//                 }),
//                 body: JSON.stringify(newStream),
//             })
//         );

//         expect(result).toEqual({
//             status: 'string',
//             message: 'string',
//             name: 'string',
//             release_name: 'string',
//             camera_id: 0,
//             input_stream: 'string',
//             output_stream: 'string',
//         });
//     });

//     test('addStream should throw an error on failure', async () => {
//         const newStream = { name: 'Test Stream' };
//         fetch.mockResolvedValueOnce({ ok: false, status: 500 });

//         await expect(addStream(newStream)).rejects.toThrow(
//             `Ошибка при добавлении стрима ${newStream.name}: 500`
//         );
//     });

//     test('getAllStreams should return all streams', async () => {
//         fetch.mockResolvedValueOnce({
//             ok: true,
//             json: jest.fn().mockResolvedValueOnce({
//                 processors: [
//                     {
//                         id: 0,
//                         name: 'string',
//                         camera_id: 0,
//                         input_stream: 'string',
//                         output_stream: 'string',
//                         release_name: 'string',
//                         created_at: '2025-06-09T12:05:13.897Z',
//                     },
//                 ],
//             }),
//         });

//         const result = await getAllStreams();

//         expect(fetch).toHaveBeenCalledWith(
//             `${SERVER_URL}kubernetes/stream-processors`,
//             expect.objectContaining({
//                 method: 'GET',
//                 headers: expect.objectContaining({
//                     Authorization: `Bearer ${mockToken}`,
//                 }),
//             })
//         );

//         expect(result).toEqual({
//             processors: [
//                 {
//                     id: 0,
//                     name: 'string',
//                     camera_id: 0,
//                     input_stream: 'string',
//                     output_stream: 'string',
//                     release_name: 'string',
//                     created_at: '2025-06-09T12:05:13.897Z',
//                 },
//             ],
//         });
//     });

//     test('getAllStreams should throw an error on failure', async () => {
//         fetch.mockResolvedValueOnce({ ok: false, status: 404 });

//         await expect(getAllStreams()).rejects.toThrow(
//             `Ошибка при получении стримов: 404`
//         );
//     });

//     test('deleteStream should successfully delete a stream', async () => {
//         const streamName = 'Test Stream';
//         fetch.mockResolvedValueOnce({ ok: true });

//         await deleteStream(streamName);

//         expect(fetch).toHaveBeenCalledWith(
//             `${SERVER_URL}kubernetes/stream-processor/${streamName}`,
//             expect.objectContaining({
//                 method: 'DELETE',
//                 headers: expect.objectContaining({
//                     Authorization: `Bearer ${mockToken}`,
//                 }),
//             })
//         );
//     });

//     test('deleteStream should throw an error on failure', async () => {
//         const streamName = 'Test Stream';
//         fetch.mockResolvedValueOnce({ ok: false, status: 400 });

//         await expect(deleteStream(streamName)).rejects.toThrow(
//             `Ошибка при удалении стрима ${streamName}: 400`
//         );
//     });

//     test('fetchPersons - success', async () => {
//         fetch.mockResponseOnce(
//             JSON.stringify([
//                 {
//                     name: 'string',
//                     id: 0,
//                     faces: [],
//                 },
//             ])
//         );

//         const response = await fetchPersons();
//         expect(response).toEqual([
//             {
//                 name: 'string',
//                 id: 0,
//                 faces: [],
//             },
//         ]);
//         expect(fetch).toHaveBeenCalledWith(
//             `${SERVER_URL}persons/`,
//             expect.any(Object)
//         );
//     });

//     test('fetchPersons - failure', async () => {
//         fetch.mockResponseOnce('', { status: 500 });

//         await expect(fetchPersons()).rejects.toThrow(
//             'Ошибка при получении списка сотрудников: 500'
//         );
//     });

//     test('addPerson - success', async () => {
//         const newPerson = { name: 'Ivan' };
//         fetch.mockResponseOnce(
//             JSON.stringify({
//                 name: 'Ivan',
//                 id: 0,
//                 faces: [],
//             })
//         );

//         const response = await addPerson(newPerson);
//         expect(response).toEqual({
//             name: 'Ivan',
//             id: 0,
//             faces: [],
//         });
//         expect(fetch).toHaveBeenCalledWith(
//             `${SERVER_URL}persons/`,
//             expect.any(Object)
//         );
//     });

//     test('addPerson - failure', async () => {
//         const newPerson = { name: 'Jane Doe' };
//         fetch.mockResponseOnce('', { status: 400 });

//         await expect(addPerson(newPerson)).rejects.toThrow(
//             'Ошибка при добавлении сотрудника: 400'
//         );
//     });

//     test('fetchPerson should successfully fetch a person', async () => {
//         const personId = '123';
//         const mockResponse = {
//             name: 'string',
//             id: 0,
//             faces: [],
//         };

//         fetch.mockResolvedValueOnce({
//             ok: true,
//             json: jest.fn().mockResolvedValueOnce(mockResponse),
//         });

//         const result = await fetchPerson(personId);

//         expect(fetch).toHaveBeenCalledWith(
//             `${SERVER_URL}persons/${personId}`,
//             expect.objectContaining({
//                 method: 'GET',
//                 headers: expect.objectContaining({
//                     Authorization: `Bearer ${mockToken}`,
//                 }),
//             })
//         );

//         expect(result).toEqual(mockResponse);
//     });

//     test('fetchPerson should throw an error on failure', async () => {
//         const personId = '123';
//         fetch.mockResolvedValueOnce({ ok: false, status: 404 });

//         await expect(fetchPerson(personId)).rejects.toThrow(
//             `Ошибка при получении данных о сотруднике: 404`
//         );
//     });

//     test('deletePerson should successfully delete a person', async () => {
//         const personId = '123';
//         fetch.mockResolvedValueOnce({
//             ok: true,
//             json: jest.fn().mockResolvedValueOnce({ success: true }),
//         });

//         const result = await deletePerson(personId);

//         expect(fetch).toHaveBeenCalledWith(
//             `${SERVER_URL}persons/${personId}`,
//             expect.objectContaining({
//                 method: 'DELETE',
//                 headers: expect.objectContaining({
//                     Authorization: `Bearer ${mockToken}`,
//                 }),
//             })
//         );

//         expect(result).toEqual({ success: true });
//     });

//     test('deletePerson should throw an error on failure', async () => {
//         const personId = '123';
//         fetch.mockResolvedValueOnce({ ok: false, status: 403 });

//         await expect(deletePerson(personId)).rejects.toThrow(
//             `Ошибка при удалении данных: 403`
//         );
//     });

//     test('updatePerson should successfully update a person', async () => {
//         const personId = '123';
//         const updatedPersonData = { name: 'Ivan' };

//         fetch.mockResolvedValueOnce({
//             ok: true,
//             json: jest
//                 .fn()
//                 .mockResolvedValueOnce({ id: personId, ...updatedPersonData }),
//         });

//         const result = await updatePerson(personId, updatedPersonData);

//         expect(fetch).toHaveBeenCalledWith(
//             `${SERVER_URL}persons/${personId}`,
//             expect.objectContaining({
//                 method: 'PUT',
//                 headers: expect.objectContaining({
//                     Authorization: `Bearer ${mockToken}`,
//                     'Content-Type': 'application/json',
//                 }),
//                 body: JSON.stringify(updatedPersonData),
//             })
//         );

//         expect(result).toEqual({ id: personId, ...updatedPersonData });
//     });

//     test('updatePerson should throw an error on failure', async () => {
//         const personId = '123';
//         const updatedPersonData = { name: 'Jane Doe' };

//         fetch.mockResolvedValueOnce({ ok: false, statusText: 'Bad Request' });

//         await expect(updatePerson(personId, updatedPersonData)).rejects.toThrow(
//             'Ошибка при обновлении данных: Bad Request'
//         );
//     });

//     test('fetchFaces should successfully fetch faces', async () => {
//         const mockResponse = [
//             {
//                 person_id: 0,
//                 encoding: 'string',
//                 id: 0,
//             },
//         ];

//         fetch.mockResolvedValueOnce({
//             ok: true,
//             json: jest.fn().mockResolvedValueOnce(mockResponse),
//         });

//         const result = await fetchFaces();

//         expect(fetch).toHaveBeenCalledWith(
//             `${SERVER_URL}faces/`,
//             expect.objectContaining({
//                 method: 'GET',
//                 headers: expect.objectContaining({
//                     Authorization: `Bearer ${mockToken}`,
//                 }),
//             })
//         );

//         expect(result).toEqual(mockResponse);
//     });

//     test('fetchFaces should throw an error on failure', async () => {
//         fetch.mockResolvedValueOnce({ ok: false, status: 500 });
//         jest.spyOn(global, 'getCookie').mockReturnValue('token123');

//         await expect(fetchFaces()).rejects.toThrow(
//             `Ошибка при получении лиц: 500`
//         );
//     });
// });
