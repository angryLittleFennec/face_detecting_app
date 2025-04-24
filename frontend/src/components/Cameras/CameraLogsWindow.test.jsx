import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CameraLogsWindow from './CameraLogsWindow';
import DataHandlers from '../DataPages/DataHandlers';

jest.mock('../DataPages/DataHandlers'); // Мокаем DataHandlers

describe('CameraLogsWindow Component', () => {
    const onCloseMock = jest.fn();

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('does not render when isOpen is false', () => {
        render(<CameraLogsWindow isOpen={false} onClose={onCloseMock} />);
        expect(screen.queryByText('Логи камеры')).not.toBeInTheDocument();
    });

    test('renders correctly when isOpen is true and logs are available', () => {
        const mockFiles = ['file1.pdf'];
        DataHandlers.mockReturnValue({
            files: mockFiles,
            handleDownload: jest.fn(),
        });

        render(<CameraLogsWindow isOpen={true} onClose={onCloseMock} />);

        expect(screen.getByText('Логи камеры')).toBeInTheDocument();
        expect(screen.getByText('Скачать')).toBeInTheDocument();
        expect(screen.getByText('Закрыть')).toBeInTheDocument();
        expect(screen.getByText('Логи отсутствуют')).not.toBeInTheDocument();
    });

    test('renders message when no logs are found', () => {
        DataHandlers.mockReturnValue({
            files: [],
            handleDownload: jest.fn(),
        });

        render(<CameraLogsWindow isOpen={true} onClose={onCloseMock} />);

        expect(screen.getByText('Логи камеры')).toBeInTheDocument();
        expect(screen.getByText('Логи отсутствуют')).toBeInTheDocument();
        expect(screen.queryByText('Скачать')).not.toBeInTheDocument();
    });

    test('calls handleDownload when download button is clicked', () => {
        const mockFiles = ['file1.pdf'];
        const handleDownloadMock = jest.fn();

        DataHandlers.mockReturnValue({
            files: mockFiles,
            handleDownload: handleDownloadMock,
        });

        render(<CameraLogsWindow isOpen={true} onClose={onCloseMock} />);

        fireEvent.click(screen.getByText('Скачать'));
        expect(handleDownloadMock).toHaveBeenCalledWith(mockFiles[0]);
    });

    test('calls onClose when close button is clicked', () => {
        const mockFiles = ['file1.pdf'];

        DataHandlers.mockReturnValue({
            files: mockFiles,
            handleDownload: jest.fn(),
        });

        render(<CameraLogsWindow isOpen={true} onClose={onCloseMock} />);

        fireEvent.click(screen.getByText('Закрыть'));
        expect(onCloseMock).toHaveBeenCalledTimes(1);
    });
});
