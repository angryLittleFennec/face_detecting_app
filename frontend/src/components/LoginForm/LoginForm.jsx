import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../Cameras/Api';
import './LoginForm.css';

function LoginForm({ onLoginSuccess }) {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        const user = { login, password };

        navigate('/cameras'); // пока не работает логика входа

        // Проверка пользователя
        /*const data = await loginUser(user);
        localStorage.setItem('token', data.token); // Сохраняем токен
        onLoginSuccess('');
        navigate('/cameras');
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
