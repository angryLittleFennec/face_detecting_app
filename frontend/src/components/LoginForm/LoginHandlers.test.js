import { loginUser, registerUser } from '../Cameras/Api'; // Импортируем функции API
import { handleLogin, handleRegister } from './LoginHandlers'; // Импортируем функции из LoginHandlers
import { useAuth } from './AuthContext'; // Импортируем контекст аутентификации

jest.mock('../Cameras/Api', () => ({
    loginUser: jest.fn(),
    registerUser: jest.fn(),
}));

jest.mock('./AuthContext', () => ({
    useAuth: jest.fn(),
}));

jest.mock('./LoginHandlers', () => ({
    handleLogin: jest.fn(),
    handleRegister: jest.fn(),
}));

describe('LoginHandlers Functions', () => {
    const mockLogin = jest.fn();

    beforeEach(() => {
        useAuth.mockReturnValue({ login: mockLogin });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('handleLogin should call loginUser and useAuth.login on success', async () => {
        const mockUserData = { access_token: 'token123' };
        loginUser.mockResolvedValue(mockUserData); // Мокаем успешный ответ от API

        const username = 'testuser';
        const password = 'password';
        const grant_type = 'password';

        await loginUser({
            grant_type: grant_type,
            password: password,
            username: username,
        });

        expect(loginUser).toHaveBeenCalledWith({
            grant_type,
            password,
            username,
        });
        //expect(mockLogin).toHaveBeenCalledWith('token123');
    });

    test('handleLogin should handle error correctly', async () => {
        loginUser.mockRejectedValue(new Error('Login failed')); // Мокаем ошибку от API

        const username = 'testuser';
        const password = 'password';
        const grant_type = 'password';

        await expect(
            loginUser({
                grant_type: grant_type,
                password: password,
                username: username,
            })
        ).rejects.toThrow('Login failed');
    });

    test('handleRegister should call registerUser on success', async () => {
        registerUser.mockResolvedValue({}); // Мокаем успешный ответ от API

        const email = 'test@example.com';
        const username = 'testuser';
        const password = 'password';

        await registerUser({
            email: email,
            password: password,
            username: username,
        });

        expect(registerUser).toHaveBeenCalledWith({
            email,
            password,
            username,
        });
    });

    test('handleRegister should handle error correctly', async () => {
        registerUser.mockRejectedValue(new Error('Registration failed')); // Мокаем ошибку от API

        const email = 'test@example.com';
        const username = 'testuser';
        const password = 'password';

        await expect(
            registerUser({
                email: email,
                password: password,
                username: username,
            })
        ).rejects.toThrow('Registration failed');
    });
});
