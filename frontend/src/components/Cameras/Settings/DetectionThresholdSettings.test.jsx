import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DetectionThresholdSettings from './DetectionThresholdSettings'; // Укажите правильный путь к вашему файлу

describe('DetectionThresholdSettings Component', () => {
    beforeEach(() => {
        render(<DetectionThresholdSettings />);
    });

    test('renders input fields with initial values', () => {
        const faceInput = screen.getByLabelText(
            /Порог уверенности для детекции лиц/i
        );
        const silhouetteInput = screen.getByLabelText(
            /Порог уверенности для детекции силуэтов/i
        );
        const iouInput = screen.getByLabelText(/Intersection over Union/i);

        expect(faceInput.value).toBe('0.7');
        expect(silhouetteInput.value).toBe('0.7');
        expect(iouInput.value).toBe('0.8');
    });

    test('allows changing face detection threshold', () => {
        const faceInput = screen.getByLabelText(
            /Порог уверенности для детекции лиц/i
        );

        fireEvent.change(faceInput, { target: { value: '0.9' } });

        expect(faceInput.value).toBe('0.9');
    });

    test('allows changing silhouette detection threshold', () => {
        const silhouetteInput = screen.getByLabelText(
            /Порог уверенности для детекции силуэтов/i
        );

        fireEvent.change(silhouetteInput, { target: { value: '0.85' } });

        expect(silhouetteInput.value).toBe('0.85');
    });

    test('allows changing IoU threshold', () => {
        const iouInput = screen.getByLabelText(/Intersection over Union/i);

        fireEvent.change(iouInput, { target: { value: '0.75' } });

        expect(iouInput.value).toBe('0.75');
    });

    test('calls handleSaveSettings on button click', () => {
        const consoleLogSpy = jest.spyOn(console, 'log');
        const saveButton = screen.getByRole('button', {
            name: /Сохранить настройки/i,
        });

        fireEvent.click(saveButton);

        expect(consoleLogSpy).toHaveBeenCalledWith('Настройки сохранены:', {
            faceDetectionThreshold: 0.7,
            silhouetteDetectionThreshold: 0.7,
            iouThreshold: 0.8,
        });

        consoleLogSpy.mockRestore(); // Восстанавливаем оригинальный console.log
    });
});
