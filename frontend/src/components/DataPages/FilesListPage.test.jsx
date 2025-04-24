import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useSelector } from 'react-redux';
import FileListPage from './FileListPage';
import NavigationHandlers from '../GeneralComponents/NavigationHandlers';

jest.mock('react-redux', () => ({
    useSelector: jest.fn(),
}));

jest.mock('../GeneralComponents/NavigationHandlers', () => jest.fn());

jest.mock('../UI/ButtonWithTooltip', () => ({ altText, onClick }) => (
    <button aria-label={altText} onClick={onClick}>
        {altText}
    </button>
));

describe('FileListPage Component', () => {
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

    test('renders correctly with no files', () => {
        useSelector.mockReturnValue([]);

        render(<FileListPage onLogout={onLogoutMock} />);

        expect(screen.getByText('Список файлов')).toBeInTheDocument();
        expect(screen.getByText('Файлы отсутствуют')).toBeInTheDocument();
    });

    test('renders correctly with files', () => {
        const mockFiles = [{ name: 'file1.txt' }, { name: 'file2.txt' }];
        useSelector.mockReturnValue(mockFiles);

        render(<FileListPage onLogout={onLogoutMock} />);

        expect(screen.getByText('Список файлов')).toBeInTheDocument();
        expect(screen.getByText('file1.txt')).toBeInTheDocument();
        expect(screen.getByText('file2.txt')).toBeInTheDocument();
    });

    test('calls navigation handlers on button clicks', () => {
        useSelector.mockReturnValue([]);

        render(<FileListPage onLogout={onLogoutMock} />);

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
