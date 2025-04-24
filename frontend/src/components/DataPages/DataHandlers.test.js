import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import DataHandlers from './DataHandlers';
import pdfToText from 'react-pdftotext';

jest.mock('react-pdftotext'); // Мокаем pdfToText

const mockStore = configureStore([]);

describe('DataHandlers', () => {
    let store;

    beforeEach(() => {
        // Создаем моковое состояние Redux
        store = mockStore({
            files: [{ name: 'test.pdf' }],
        });

        // Мокаем pdfToText, чтобы он возвращал промис с текстом
        pdfToText.mockImplementation(() => Promise.resolve('Тестовый текст'));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should extract text from pdf file', async () => {
        const { result, waitForNextUpdate } = render(
            <Provider store={store}>
                <DataHandlers />
            </Provider>
        );

        // Достаем функцию extractText из результата
        const { extractText } = result.current;

        // Вызываем функцию extractText
        extractText();

        // Ждем, пока текст будет извлечен
        await waitForNextUpdate();

        // Проверяем, что extractedText обновился
        expect(result.current.extractedText).toBe('Тестовый текст');
    });

    test('should format text with dates correctly', () => {
        const { result } = render(
            <Provider store={store}>
                <DataHandlers />
            </Provider>
        );

        const { formatTextWithDates } = result.current;
        const formattedText = formatTextWithDates('line 1. line 2. line 3.');

        expect(formattedText).toBe('\nline 1\nline 2\nline 3');
    });

    test('should handle file download', () => {
        const { result } = render(
            <Provider store={store}>
                <DataHandlers />
            </Provider>
        );

        const { handleDownload } = result.current;

        // Создаем мок для createObjectURL
        const createObjectURLMock = jest
            .spyOn(URL, 'createObjectURL')
            .mockReturnValue('mocked-url');

        // Создаем файл для теста
        const file = new Blob(['test content'], { type: 'application/pdf' });
        file.name = 'test.pdf';

        // Вызываем функцию handleDownload
        handleDownload(file);

        // Проверяем, что createObjectURL был вызван
        expect(createObjectURLMock).toHaveBeenCalledWith(file);

        // Проверяем, что элемент ссылки был создан и кликнут
        expect(document.body.querySelector('a')).toBeTruthy();

        // Убираем мок
        createObjectURLMock.mockRestore();
    });
});
