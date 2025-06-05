import { useState } from 'react';
import { useNavigate } from 'react-router';
import { loginUser, registerUser } from '../Cameras/Api';
import { useAuth } from './AuthContext';

const LoginHandlers = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [needToLogin, setNeedToLogin] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const { login } = useAuth();

    // При попытке входа
    const onSubmitLoginHandler = async (event) => {
        event.preventDefault();
        const user = { username, password, grant_type: 'password' };

        // Проверка пользователя
        try {
            const data = await loginUser(user);
            // Сохраняем токен в куки
            login(data.access_token);
            navigate('/cameras');
        } catch (error) {
            console.log(error);
            setErrorMessage(
                'Ошибка авторизации. Проверьте логин и пароль или попробуйте позже.'
            );
        }
    };

    // При попытке регистрации
    const onSubmitRegistrationHandler = async (event) => {
        event.preventDefault();
        const user = { email, username, password };

        // Регистрация пользователя
        try {
            const data = await registerUser(user);
            console.log(data);
            setNeedToLogin(false);
        } catch (error) {
            console.log(error);
            setErrorMessage('Ошибка регистрации. Попробуйте позже.');
        }
    };

    const loginHandler = () => {
        setNeedToLogin(false);
    };

    const registrationHandler = () => {
        setNeedToLogin(true);
    };

    return {
        email,
        username,
        password,
        needToLogin,
        errorMessage,
        setEmail,
        setUsername,
        setPassword,
        onSubmitLoginHandler,
        onSubmitRegistrationHandler,
        loginHandler,
        registrationHandler,
    };
};

export default LoginHandlers;
