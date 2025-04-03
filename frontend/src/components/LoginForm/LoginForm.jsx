import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginForm.css';

function LoginForm({ onLoginSuccess }) {
    const SERVER = 'http://localhost:8000';
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        const user = { login, password };

        navigate('/cameras'); // пока не работает логика входа

        // Проверка пользователя
        /*try {
            const response = await fetch(`${SERVER}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(user),
            });

            if (response.ok) {
                const data = await response.json(); // Получаем данные от сервера
                localStorage.setItem('token', data.token); // Сохраняем токен
                onLoginSuccess('');
                navigate('/cameras');
            } else {
                const errorData = await response.json(); // Получаем сообщение об ошибке
                onLoginSuccess(
                    errorData.message || 'Неверный логин или пароль'
                ); // Используем сообщение от сервера
            }
        } catch (error) {
            onLoginSuccess('Ошибка сети. Попробуйте позже.');
        }*/
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={onSubmitHandler}>
                <h2>ВХОД</h2>
                <input
                    placeholder="ЛОГИН"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
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
            </form>
        </div>
    );
}

export default LoginForm;
