import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import store from '../../store';
import CameraLogsWindow from './CameraLogsWindow';
import DataHandlers from '../DataPages/DataHandlers';

// Мокаем DataHandlers для тестов
jest.mock('../DataPages/DataHandlers', () => ({
    __esModule: true,
    default: jest.fn(),
}));

describe('CameraLogsWindow', () => {
    let handleCloseMock;

    beforeEach(() => {
        handleCloseMock = jest.fn();
        DataHandlers.mockReturnValue({
            files: [],
            handleDownload: jest.fn(),
        });
    });

    test('renders null when isOpen is false', () => {
        const { container } = render(
            <Provider store={store}>
                <CameraLogsWindow isOpen={false} onClose={handleCloseMock} />
            </Provider>
        );

        expect(container.firstChild).toBeNull();
    });

    test('renders "Логи отсутствуют" when no files are available', () => {
        const { getByText } = render(
            <Provider store={store}>
                <CameraLogsWindow isOpen={true} onClose={handleCloseMock} />
            </Provider>
        );

        expect(getByText('Логи отсутствуют')).toBeInTheDocument();
    });

    test('renders PdfViewer when files are available', () => {
        const mockFile = 'mockFile.pdf';
        DataHandlers.mockReturnValue({
            files: [mockFile],
            handleDownload: jest.fn(),
        });

        const { getByText } = render(
            <Provider store={store}>
                <CameraLogsWindow isOpen={true} onClose={handleCloseMock} />
            </Provider>
        );

        expect(getByText('Логи камеры')).toBeInTheDocument();
        expect(getByText('Скачать')).toBeInTheDocument();
        expect(getByText('Закрыть')).toBeInTheDocument();
    });

    test('calls handleDownload when download button is clicked', () => {
        const mockFile = 'mockFile.pdf';
        const handleDownloadMock = jest.fn();

        DataHandlers.mockReturnValue({
            files: [mockFile],
            handleDownload: handleDownloadMock,
        });

        const { getByText } = render(
            <Provider store={store}>
                <CameraLogsWindow isOpen={true} onClose={handleCloseMock} />
            </Provider>
        );

        fireEvent.click(getByText('Скачать'));

        expect(handleDownloadMock).toHaveBeenCalledWith(mockFile);
    });

    test('calls onClose when close button is clicked', () => {
        const mockFile = 'mockFile.pdf';

        DataHandlers.mockReturnValue({
            files: [mockFile],
            handleDownload: jest.fn(),
        });

        const { getByText } = render(
            <Provider store={store}>
                <CameraLogsWindow isOpen={true} onClose={handleCloseMock} />
            </Provider>
        );

        fireEvent.click(getByText('Закрыть'));

        expect(handleCloseMock).toHaveBeenCalledTimes(1);
    });
});
