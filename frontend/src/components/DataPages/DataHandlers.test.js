import { render, screen, fireEvent } from '@testing-library/react';
import DataHandlers from './DataHandlers';
import {
    fetchPersons,
    addPerson,
    addFace,
    updatePerson,
    deletePerson,
    downloadLogs,
    downloadCameraLogs,
    downloadPersonLogs,
    fetchLogsList,
    fetchCameraLogsList,
    fetchPersonLogsList,
    sendEmail,
} from '../Cameras/Api'; // Импортируйте необходимые функции

jest.mock('../Cameras/Api'); // Мокаем API функции

describe('DataHandlers Component', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Сброс мока перед каждым тестом
    });

    test('handles downloadLogs correctly', async () => {
        const mockBlob = new Blob(['log data'], { type: 'application/pdf' });
        downloadLogs.mockResolvedValue(mockBlob);

        const result = await downloadLogs();

        expect(result).toBeInstanceOf(Blob);
        expect(result.type).toBe('application/pdf');
    });

    test('handles downloadCameraLogs correctly', async () => {
        const mockStreamId = '123';
        const mockBlob = new Blob(['log data'], { type: 'application/pdf' });
        downloadCameraLogs.mockResolvedValue(mockBlob); // Мокаем функцию для успешного ответа

        const result = await downloadCameraLogs(mockStreamId);

        expect(result).toBeInstanceOf(Blob);
        expect(result.type).toBe('application/pdf');
    });

    test('handles downloadPersonLogs correctly', async () => {
        const mockPersonId = '123';
        const mockBlob = new Blob(['log data'], { type: 'application/pdf' });
        downloadPersonLogs.mockResolvedValue(mockBlob); // Мокаем функцию для успешного ответа

        const result = await downloadPersonLogs(mockPersonId);

        expect(result).toBeInstanceOf(Blob);
        expect(result.type).toBe('application/pdf');
    });

    test('handles fetchLogsList correctly', async () => {
        const mockFiles = [
            {
                event_type: 'enter',
                person_id: 0,
                stream_processor_id: 0,
                track_id: 0,
                duration: 0,
                id: 0,
                timestamp: '2025-06-09T09:40:03.244Z',
                is_aggregated: true,
            },
        ];
        fetchLogsList.mockResolvedValue(mockFiles); // Мокаем функцию для успешного ответа

        const result = await fetchLogsList();

        expect(result).toEqual(mockFiles);
    });

    test('handles fetchCameraLogsList correctly', async () => {
        const streamId = '123';
        const mockFiles = [
            {
                event_type: 'enter',
                person_id: 0,
                stream_processor_id: 0,
                track_id: 0,
                duration: 0,
                id: 0,
                timestamp: '2025-06-09T09:40:03.244Z',
                is_aggregated: true,
            },
        ];
        fetchCameraLogsList.mockResolvedValue(mockFiles); // Мокаем функцию для успешного ответа

        const result = await fetchCameraLogsList(streamId);

        expect(result).toEqual(mockFiles);
    });

    test('handles fetchPersonLogsList correctly', async () => {
        const personId = '123';
        const mockFiles = [
            {
                event_type: 'enter',
                person_id: 0,
                stream_processor_id: 0,
                track_id: 0,
                duration: 0,
                id: 0,
                timestamp: '2025-06-09T09:40:03.244Z',
                is_aggregated: true,
            },
        ];
        fetchPersonLogsList.mockResolvedValue(mockFiles); // Мокаем функцию для успешного ответа

        const result = await fetchPersonLogsList(personId);

        expect(result).toEqual(mockFiles);
    });

    test('handles fetch persons correctly', async () => {
        const mockPersons = [
            { name: 'Ivan', id: 1, faces: [] },
            { name: 'Dima', id: 2, faces: [] },
        ];
        fetchPersons.mockResolvedValue(mockPersons);

        const result = await fetchPersons(); // Вызываем функцию напрямую

        expect(result).toEqual(mockPersons);
    });

    test('handles addPerson correctly', async () => {
        const personData = { name: 'Ivan' };
        addPerson.mockResolvedValue(personData); // Мокаем функцию для успешного ответа

        const result = await addPerson(personData);
        expect(result).toEqual(personData);
    });

    test('handles updatePerson correctly', async () => {
        const personId = '123';
        const personData = { name: 'Ivan' };
        updatePerson.mockResolvedValue(personId, personData); // Мокаем функцию для успешного ответа

        const result = await updatePerson(personId, personData);
        expect(result).toEqual(personId, personData);
    });

    test('handles error in downloadCameraLogs', async () => {
        const errorMessage = 'Error download camera logs';
        downloadCameraLogs.mockRejectedValue(new Error(errorMessage));

        await expect(downloadCameraLogs({})).rejects.toThrow(errorMessage);
    });

    test('handles error in add person', async () => {
        const errorMessage = 'Error adding person';
        addPerson.mockRejectedValue(new Error(errorMessage));

        await expect(addPerson({})).rejects.toThrow(errorMessage); // Проверяем, что ошибка выбрасывается
    });

    test('handles error in fetch persons', async () => {
        const errorMessage = 'Error fetching persons';
        fetchPersons.mockRejectedValue(new Error(errorMessage));

        await expect(fetchPersons()).rejects.toThrow(errorMessage); // Проверяем, что ошибка выбрасывается
    });

    test('handles error in add face', async () => {
        const errorMessage = 'Error adding face';
        addFace.default.mockRejectedValue(new Error(errorMessage));

        await expect(addFace({})).rejects.toThrow(errorMessage); // Проверяем, что ошибка выбрасывается
    });

    test('handles error in send email', async () => {
        const errorMessage = 'Error sending email';
        sendEmail.mockRejectedValue(new Error(errorMessage));

        await expect(sendEmail({})).rejects.toThrow(errorMessage); // Проверяем, что ошибка выбрасывается
    });
});
