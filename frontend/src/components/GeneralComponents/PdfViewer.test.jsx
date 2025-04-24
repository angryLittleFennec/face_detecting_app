import React from 'react';
import { render, screen } from '@testing-library/react';
import PdfViewer from './PdfViewer';
import DataHandlers from '../DataPages/DataHandlers';

// Мокаем DataHandlers
jest.mock('../DataPages/DataHandlers');

describe('PdfViewer Component', () => {
    const mockExtractText = jest.fn();
    const mockFormatTextWithDates = jest.fn();

    beforeEach(() => {
        // Настраиваем моки для DataHandlers
        DataHandlers.mockReturnValue({
            extractedText: 'Тестовый текст',
            extractText: mockExtractText,
            formatTextWithDates: mockFormatTextWithDates,
        });

        // Указываем, как должен вести себя mockFormatTextWithDates
        mockFormatTextWithDates.mockReturnValue('Отформатированный текст');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders correctly and calls extractText on mount', () => {
        render(<PdfViewer />);

        // Проверяем, что компонент рендерится с отформатированным текстом
        expect(
            screen.getByText(/отформатированный текст/i)
        ).toBeInTheDocument();

        // Проверяем, что extractText был вызван при монтировании
        expect(mockExtractText).toHaveBeenCalled();
    });
});
