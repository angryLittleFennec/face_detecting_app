// Вспомогательный файл для корректной аутентификации
import { createContext, useContext, useState } from 'react';
import { getCookie } from '../Cameras/Api';

const AuthContext = createContext();

// Функция для установки куки
function setCookie(name, value, days) {
    let expires = '';
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = '; expires=' + date.toUTCString();
    }
    document.cookie =
        name + '=' + (value || '') + expires + '; path=/; SameSite=Strict';
}

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(
        !!getCookie('authToken')
    );

    const login = (token) => {
        setCookie('authToken', token, 7);
        setIsAuthenticated(true);
    };

    const logout = () => {
        setCookie('authToken', '', -1); // Удаляем токен
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
