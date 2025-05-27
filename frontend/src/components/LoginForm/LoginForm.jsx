// Страница входа/регистрации
import LoginHandlers from './LoginHandlers';
import './LoginForm.css';

function LoginForm() {
    const {
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
    } = LoginHandlers();

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
