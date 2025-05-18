import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../Cameras/Api';
import './LoginForm.css';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [needToLogin, setNeedToLogin] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    // Функция для установки куки
    function setCookie(name, value, days) {
        let expires = '';
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie =
            name +
            '=' +
            (value || '') +
            expires +
            '; path=/; Secure; SameSite=Strict';
        console.log(
            name +
                '=' +
                (value || '') +
                expires +
                '; path=/; Secure; SameSite=Strict'
        );
    }

    const onSubmitLoginHandler = async (event) => {
        event.preventDefault();
        const user = { username, password, grant_type: 'password' };

        // Проверка пользователя
        try {
            const data = await loginUser(user);
            // Сохраняем токен в куки
            setCookie('authToken', data.access_token, 7); // Сохраняем на 7 дней
            console.log('Аутентификация прошла успешно!', data.access_token);
            navigate('/cameras');
        } catch (error) {
            console.log(error);
            setErrorMessage(
                'Ошибка авторизации. Проверьте логин и пароль или попробуйте позже.'
            );
        }
    };

    const onSubmitRegistrationHandler = async (event) => {
        event.preventDefault();
        const user = { email, username, password };

        try {
            // Регистрация пользователя
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

    return (
        <div className="login-container">
            {needToLogin ? (
                <div>
                    <form
                        className="login-form"
                        onSubmit={onSubmitRegistrationHandler}
                    >
                        <h2>Регистрация</h2>
                        <input
                            placeholder="ПОЧТА"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <br />
                        <input
                            placeholder="ЛОГИН"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <br />
                        <input
                            placeholder="ПАРОЛЬ"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <br />
                        <button type="submit">Подтвердить</button>
                    </form>
                    <div className="underform-buttons-container">
                        <button
                            className="underform-button"
                            onClick={loginHandler}
                        >
                            Вход
                        </button>
                        <p>|</p>
                        <button
                            className="underform-button"
                            onClick={registrationHandler}
                        >
                            Регистрация
                        </button>
                    </div>
                    {errorMessage && (
                        <p className="error-message">{errorMessage}</p>
                    )}
                </div>
            ) : (
                <div>
                    <form
                        className="login-form"
                        onSubmit={onSubmitLoginHandler}
                    >
                        <h2>Вход</h2>
                        <input
                            placeholder="ЛОГИН"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <br />
                        <input
                            placeholder="ПАРОЛЬ"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <br />
                        <button type="submit">ВОЙТИ</button>
                        <br />
                    </form>
                    <div className="underform-buttons-container">
                        <button
                            className="underform-button"
                            onClick={loginHandler}
                        >
                            Вход
                        </button>
                        <p>|</p>
                        <button
                            className="underform-button"
                            onClick={registrationHandler}
                        >
                            Регистрация
                        </button>
                    </div>
                    {errorMessage && (
                        <p className="error-message">{errorMessage}</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default LoginForm;
