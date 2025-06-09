import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { getCookie } from '../Cameras/Api';

// Мокируем функцию getCookie
jest.mock('../Cameras/Api', () => ({
    getCookie: jest.fn(),
}));

const TestComponent = () => {
    const { isAuthenticated, login, logout } = useAuth();
    return (
        <div>
            <span data-testid="auth-status">
                {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </span>
            <button onClick={() => login('test-token')}>Login</button>
            <button onClick={logout}>Logout</button>
        </div>
    );
};

describe('AuthProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should initialize with not authenticated state if cookie is not set', () => {
        getCookie.mockReturnValue(null); // Мокируем, чтобы возвращать null

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        expect(screen.getByTestId('auth-status')).toHaveTextContent(
            'Not Authenticated'
        );
    });

    it('should initialize with authenticated state if cookie is set', () => {
        getCookie.mockReturnValue('some-token'); // Мокируем, чтобы возвращать токен

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        expect(screen.getByTestId('auth-status')).toHaveTextContent(
            'Authenticated'
        );
    });

    it('should log in and set the auth token cookie', () => {
        getCookie.mockReturnValue(null); // Начинаем с неаутентифицированного состояния

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        screen.getByText('Login').click();

        expect(document.cookie).toContain('authToken=test-token');
        expect(screen.getByTestId('auth-status')).toHaveTextContent(
            'Authenticated'
        );
    });

    it('should log out and remove the auth token cookie', () => {
        getCookie.mockReturnValue('some-token'); // Начинаем с аутентифицированного состояния

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        screen.getByText('Logout').click();

        expect(document.cookie).not.toContain('authToken');
        expect(screen.getByTestId('auth-status')).toHaveTextContent(
            'Not Authenticated'
        );
    });
});
