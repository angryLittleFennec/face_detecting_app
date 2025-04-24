import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useSelector } from 'react-redux';
import DownloadDataPage from './DownloadDataPage';
import NavigationHandlers from '../GeneralComponents/NavigationHandlers';

jest.mock('../GeneralComponents/NavigationHandlers', () => jest.fn());

jest.mock('../UI/ButtonWithTooltip', () => ({ altText, onClick }) => (
    <button aria-label={altText} onClick={onClick}>
        {altText}
    </button>
));

jest.mock('../UI/FileUploadButton', () => () => <button>Upload File</button>);

describe('DownloadDataPage Component', () => {
    const onLogoutMock = jest.fn();
    const goToCamerasHandlerMock = jest.fn();
    const goToFilesHandlerMock = jest.fn();
    const goToStaffHandlerMock = jest.fn();
    const goToDataHandlerMock = jest.fn();
    const logoutHandlerMock = jest.fn();

    beforeEach(() => {
        NavigationHandlers.mockReturnValue({
            goToCamerasHandler: goToCamerasHandlerMock,
            goToFilesHandler: goToFilesHandlerMock,
            goToStaffHandler: goToStaffHandlerMock,
            goToDataHandler: goToDataHandlerMock,
            logoutHandler: logoutHandlerMock,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders correctly', () => {
        render(<DownloadDataPage onLogout={onLogoutMock} />);

        expect(screen.getByText('Загрузите нужный файл')).toBeInTheDocument();
        expect(screen.getByText('Upload File')).toBeInTheDocument();
    });

    test('calls navigation handlers on button clicks', () => {
        render(<DownloadDataPage onLogout={onLogoutMock} />);

        fireEvent.click(screen.getByLabelText('Назад'));
        expect(goToCamerasHandlerMock).toHaveBeenCalled();

        fireEvent.click(screen.getByLabelText('Загрузка файлов'));
        expect(goToDataHandlerMock).toHaveBeenCalled();

        fireEvent.click(screen.getByLabelText('Список файлов'));
        expect(goToFilesHandlerMock).toHaveBeenCalled();

        fireEvent.click(screen.getByLabelText('Сотрудники'));
        expect(goToStaffHandlerMock).toHaveBeenCalled();

        fireEvent.click(screen.getByLabelText('Выход'));
        expect(logoutHandlerMock).toHaveBeenCalled();
    });
});
