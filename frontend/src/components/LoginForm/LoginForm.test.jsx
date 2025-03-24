import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LoginForm from './LoginForm'; // Путь к вашему компоненту
import '@testing-library/jest-dom/extend-expect';

// Мокаем fetch
global.fetch = jest.fn();

describe('LoginForm', () => {
    const mockOnLoginSuccess = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks(); // Очищаем моки перед каждым тестом
    });

    test('renders login form', () => {
        render(<LoginForm onLoginSuccess={mockOnLoginSuccess} />);
        expect(screen.getByPlaceholderText('ЛОГИН')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('ПАРОЛЬ')).toBeInTheDocument();
        expect(screen.getByText('ВОЙТИ')).toBeInTheDocument();
    });

    test('successful login', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValueOnce({ token: 'fake-token' }),
        });

        render(<LoginForm onLoginSuccess={mockOnLoginSuccess} />);

        fireEvent.change(screen.getByPlaceholderText('ЛОГИН'), {
            target: { value: 'testuser' },
        });
        fireEvent.change(screen.getByPlaceholderText('ПАРОЛЬ'), {
            target: { value: 'password123' },
        });
        fireEvent.click(screen.getByText('ВОЙТИ'));

        // Ждем, пока промис выполнится
        await screen.findByText('ВОЙТИ'); // или любой другой элемент, который появляется после успешного входа

        expect(localStorage.setItem).toHaveBeenCalledWith(
            'token',
            'fake-token'
        );
        expect(mockOnLoginSuccess).toHaveBeenCalledWith('');
        // Проверяем, что navigate был вызван
        expect(require('react-router-dom').useNavigate()).toHaveBeenCalledWith(
            '/cameras'
        );
    });

    test('failed login with wrong credentials', async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            json: jest.fn().mockResolvedValueOnce({
                message: 'Неверный логин или пароль',
            }),
        });

        render(<LoginForm onLoginSuccess={mockOnLoginSuccess} />);

        fireEvent.change(screen.getByPlaceholderText('ЛОГИН'), {
            target: { value: 'wronguser' },
        });
        fireEvent.change(screen.getByPlaceholderText('ПАРОЛЬ'), {
            target: { value: 'wrongpassword' },
        });
        fireEvent.click(screen.getByText('ВОЙТИ'));

        await screen.findByText('ВОЙТИ'); // или любой другой элемент, который появляется после попытки входа

        expect(mockOnLoginSuccess).toHaveBeenCalledWith(
            'Неверный логин или пароль'
        );
    });

    test('handles network error', async () => {
        fetch.mockRejectedValueOnce(new Error('Network error'));

        render(<LoginForm onLoginSuccess={mockOnLoginSuccess} />);

        fireEvent.change(screen.getByPlaceholderText('ЛОГИН'), {
            target: { value: 'testuser' },
        });
        fireEvent.change(screen.getByPlaceholderText('ПАРОЛЬ'), {
            target: { value: 'password123' },
        });
        fireEvent.click(screen.getByText('ВОЙТИ'));

        await screen.findByText('ВОЙТИ'); // или любой другой элемент, который появляется после попытки входа

        expect(mockOnLoginSuccess).toHaveBeenCalledWith(
            'Ошибка сети. Попробуйте позже.'
        );
    });
});
