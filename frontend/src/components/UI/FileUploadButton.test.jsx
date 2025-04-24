import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useDispatch } from 'react-redux';
import FileUploadButton from './FileUploadButton';
import { addFiles } from '../../actions';

// Мокаем useDispatch
jest.mock('react-redux', () => ({
    useDispatch: jest.fn(),
}));

describe('FileUploadButton Component', () => {
    const mockDispatch = jest.fn();

    beforeEach(() => {
        useDispatch.mockReturnValue(mockDispatch);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders the button and initial file name', () => {
        render(<FileUploadButton />);

        const button = screen.getByRole('button', { name: /выбрать файл/i });
        const fileNameDisplay = screen.getByText(/загруженный файл:/i);

        expect(button).toBeInTheDocument();
        expect(fileNameDisplay).toBeInTheDocument();
        expect(fileNameDisplay).toHaveTextContent('Загруженный файл: ');
    });

    test('calls dispatch with selected files on file change', () => {
        const file = new File(['file content'], 'example.txt', {
            type: 'text/plain',
        });
        const fileList = [file];

        render(<FileUploadButton />);

        const input = screen.getByLabelText(/выбрать файл/i);

        // Программный клик по input для выбора файла
        fireEvent.change(input, {
            target: { files: fileList },
        });

        expect(mockDispatch).toHaveBeenCalledWith(addFiles(fileList));
        expect(
            screen.getByText(/загруженный файл: example.txt/i)
        ).toBeInTheDocument();
    });

    test('displays "Нет файла" when no file is selected', () => {
        render(<FileUploadButton />);

        const input = screen.getByLabelText(/выбрать файл/i);

        // Программный клик по input без выбора файла
        fireEvent.change(input, {
            target: { files: [] },
        });

        expect(
            screen.getByText(/загруженный файл: нет файла/i)
        ).toBeInTheDocument();
    });
});
