import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StaffPage from './StaffPage';
import NavigationHandlers from '../GeneralComponents/NavigationHandlers';

jest.mock('../GeneralComponents/NavigationHandlers');

describe('StaffPage Component', () => {
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
        render(<StaffPage onLogout={onLogoutMock} />);

        expect(screen.getByText('Список сотрудников')).toBeInTheDocument();
        expect(
            screen.getByText('Здесь будет отображаться список сотрудников...')
        ).toBeInTheDocument();
    });

    test('renders all buttons', () => {
        render(<StaffPage onLogout={onLogoutMock} />);

        expect(screen.getByAltText('Назад')).toBeInTheDocument();
        expect(screen.getByAltText('Загрузка файлов')).toBeInTheDocument();
        expect(screen.getByAltText('Список файлов')).toBeInTheDocument();
        expect(screen.getByAltText('Сотрудники')).toBeInTheDocument();
        expect(screen.getByAltText('Выход')).toBeInTheDocument();
    });

    test('calls navigation handlers on button clicks', () => {
        render(<StaffPage onLogout={onLogoutMock} />);

        fireEvent.click(screen.getByAltText('Назад'));
        expect(goToCamerasHandlerMock).toHaveBeenCalled();

        fireEvent.click(screen.getByAltText('Загрузка файлов'));
        expect(goToDataHandlerMock).toHaveBeenCalled();

        fireEvent.click(screen.getByAltText('Список файлов'));
        expect(goToFilesHandlerMock).toHaveBeenCalled();

        fireEvent.click(screen.getByAltText('Сотрудники'));
        expect(goToStaffHandlerMock).toHaveBeenCalled();

        fireEvent.click(screen.getByAltText('Выход'));
        expect(logoutHandlerMock).toHaveBeenCalled();
    });

    test('calls onLogout when logout button is clicked', () => {
        render(<StaffPage onLogout={onLogoutMock} />);

        fireEvent.click(screen.getByAltText('Выход'));
        expect(onLogoutMock).toHaveBeenCalled();
    });
});
