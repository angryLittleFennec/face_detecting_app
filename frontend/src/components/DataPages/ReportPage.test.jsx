import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ReportPage from './ReportPage';
import DataHandlers from './DataHandlers';
import NavigationHandlers from '../GeneralComponents/NavigationHandlers';
import PdfViewer from '../GeneralComponents/PdfViewer';

jest.mock('./DataHandlers');
jest.mock('../GeneralComponents/NavigationHandlers');
jest.mock('../GeneralComponents/PdfViewer', () =>
    jest.fn(() => <div>Pdf Viewer Mock</div>)
);
jest.mock('../UI/ButtonWithTooltip', () => ({ altText, onClick }) => (
    <button aria-label={altText} onClick={onClick}>
        {altText}
    </button>
));

describe('ReportPage Component', () => {
    const onLogoutMock = jest.fn();
    const goToCamerasHandlerMock = jest.fn();
    const logoutHandlerMock = jest.fn();
    const handleDownloadMock = jest.fn();

    beforeEach(() => {
        NavigationHandlers.mockReturnValue({
            goToCamerasHandler: goToCamerasHandlerMock,
            logoutHandler: logoutHandlerMock,
        });

        DataHandlers.mockReturnValue({
            files: [],
            handleDownload: handleDownloadMock,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders correctly with no files', () => {
        render(<ReportPage onLogout={onLogoutMock} />);

        expect(screen.getByText('Отчётность')).toBeInTheDocument();
        expect(screen.getByText('Логи отсутствуют')).toBeInTheDocument();
        expect(PdfViewer).not.toHaveBeenCalled();
    });

    test('renders correctly with files', () => {
        const mockFiles = ['file1.pdf'];
        DataHandlers.mockReturnValue({
            files: mockFiles,
            handleDownload: handleDownloadMock,
        });

        render(<ReportPage onLogout={onLogoutMock} />);

        expect(screen.getByText('Отчётность')).toBeInTheDocument();
        expect(PdfViewer).toHaveBeenCalledWith({ value: mockFiles[0] }, {});
        expect(
            screen.getByRole('button', { name: /Скачать/i })
        ).toBeInTheDocument();
    });

    test('calls handleDownload when download button is clicked', () => {
        const mockFiles = ['file1.pdf'];
        DataHandlers.mockReturnValue({
            files: mockFiles,
            handleDownload: handleDownloadMock,
        });

        render(<ReportPage onLogout={onLogoutMock} />);

        fireEvent.click(screen.getByRole('button', { name: /Скачать/i }));
        expect(handleDownloadMock).toHaveBeenCalledWith(mockFiles[0]);
    });

    test('calls navigation handlers on button clicks', () => {
        render(<ReportPage onLogout={onLogoutMock} />);

        fireEvent.click(screen.getByLabelText('Назад'));
        expect(goToCamerasHandlerMock).toHaveBeenCalled();

        fireEvent.click(screen.getByLabelText('Выход'));
        expect(logoutHandlerMock).toHaveBeenCalled();
    });
});
