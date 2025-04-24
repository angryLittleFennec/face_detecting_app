import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfilePage from './ProfilePage'; // Путь к вашему компоненту
import NavigationHandlers from '../GeneralComponents/NavigationHandlers';

// Мокаем NavigationHandlers
jest.mock('../GeneralComponents/NavigationHandlers');

describe('ProfilePage Component', () => {
    const mockLogout = jest.fn();
    const mockGoToCamerasHandler = jest.fn();
    const mockLogoutHandler = jest.fn();

    beforeEach(() => {
        // Настраиваем мок для NavigationHandlers
        NavigationHandlers.mockReturnValue({
            goToCamerasHandler: mockGoToCamerasHandler,
            logoutHandler: mockLogoutHandler,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders profile information correctly', () => {
        render(<ProfilePage onLogout={mockLogout} />);

        expect(screen.getByText(/основная информация/i)).toBeInTheDocument();
        expect(screen.getByText(/имя: админ/i)).toBeInTheDocument();
        expect(screen.getByText(/фамилия: админов/i)).toBeInTheDocument();
        expect(screen.getByText(/отчество: админович/i)).toBeInTheDocument();
        expect(screen.getByText(/должность: безработный/i)).toBeInTheDocument();

        expect(screen.getByText(/контактная информация/i)).toBeInTheDocument();
        expect(
            screen.getByText(/адрес электронной почты: example@email.com/i)
        ).toBeInTheDocument();
        expect(
            screen.getByText(/номер телефона: +79876543210/i)
        ).toBeInTheDocument();

        expect(
            screen.getByText(/дополнительная информация/i)
        ).toBeInTheDocument();
        expect(screen.getByText(/о себе: пусто/i)).toBeInTheDocument();
    });

    test('calls goToCamerasHandler when back button is clicked', () => {
        render(<ProfilePage onLogout={mockLogout} />);

        const backButton = screen.getByAltText(/назад/i);
        fireEvent.click(backButton);

        expect(mockGoToCamerasHandler).toHaveBeenCalledTimes(1);
    });

    test('calls logoutHandler when logout button is clicked', () => {
        render(<ProfilePage onLogout={mockLogout} />);

        const logoutButton = screen.getByAltText(/выход/i);
        fireEvent.click(logoutButton);

        expect(mockLogoutHandler).toHaveBeenCalledTimes(1);
    });
});
