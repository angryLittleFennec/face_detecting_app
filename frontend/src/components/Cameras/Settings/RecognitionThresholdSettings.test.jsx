import { render, screen, fireEvent } from '@testing-library/react';
import RecognitionThresholdSettings from './RecognitionThresholdSettings';

// Мокируем console.log для проверки вызова
console.log = jest.fn();

describe('RecognitionThresholdSettings', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render with default threshold values', () => {
        render(<RecognitionThresholdSettings />);

        const faceRecognitionInput = screen.getByLabelText(
            /Порог уверенности для распознавания лиц/i
        );
        const similarityThresholdInput =
            screen.getByLabelText(/Порог схожести лиц/i);

        expect(faceRecognitionInput.value).toBe('0.8');
        expect(similarityThresholdInput.value).toBe('0.8');
    });

    it('should update face recognition threshold value on input change', () => {
        render(<RecognitionThresholdSettings />);

        const faceRecognitionInput = screen.getByLabelText(
            /Порог уверенности для распознавания лиц/i
        );

        fireEvent.change(faceRecognitionInput, { target: { value: '0.9' } });

        expect(faceRecognitionInput.value).toBe('0.9');
    });

    it('should update similarity threshold value on input change', () => {
        render(<RecognitionThresholdSettings />);

        const similarityThresholdInput =
            screen.getByLabelText(/Порог схожести лиц/i);

        fireEvent.change(similarityThresholdInput, {
            target: { value: '0.85' },
        });

        expect(similarityThresholdInput.value).toBe('0.85');
    });

    it('should call handleSaveSettings and log the settings when button is clicked', () => {
        render(<RecognitionThresholdSettings />);

        const faceRecognitionInput = screen.getByLabelText(
            /Порог уверенности для распознавания лиц/i
        );
        const similarityThresholdInput =
            screen.getByLabelText(/Порог схожести лиц/i);
        const saveButton = screen.getByText(/Сохранить настройки/i);

        // Изменяем значения порогов
        fireEvent.change(faceRecognitionInput, { target: { value: '0.9' } });
        fireEvent.change(similarityThresholdInput, {
            target: { value: '0.85' },
        });

        // Нажимаем кнопку "Сохранить настройки"
        fireEvent.click(saveButton);

        expect(console.log).toHaveBeenCalledWith('Настройки сохранены:', {
            faceRecognitionThreshold: 0.9,
            similarityThreshold: 0.85,
        });
    });
});
