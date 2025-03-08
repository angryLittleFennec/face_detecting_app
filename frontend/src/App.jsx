import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './components/LoginForm/LoginForm';
import ProfilePage from './components/Profile/ProfilePage';
import CamerasPage from './components/Cameras/CamerasPage';
import './App.css';

function App() {
    const [message, setMessage] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        return localStorage.getItem('isLoggedIn') === 'true';
    });

    const handleLoginSuccess = (msg) => {
        setMessage(msg);
        //setIsLoggedIn(true);
        localStorage.setItem('isLoggedIn', 'true');
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        localStorage.removeItem('isLoggedIn');
    };

    return (
        <BrowserRouter>
            <div className="App">
                <Routes>
                    <Route
                        path="/"
                        element={
                            <LoginForm onLoginSuccess={handleLoginSuccess} />
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            isLoggedIn ? (
                                <ProfilePage onLogout={handleLogout} />
                            ) : (
                                <Navigate to="/" />
                            )
                        }
                    />
                    <Route
                        path="/cameras"
                        element={
                            isLoggedIn ? (
                                <CamerasPage onLogout={handleLogout} />
                            ) : (
                                <Navigate to="/" />
                            )
                        }
                    />
                </Routes>
                {message && <p>{message}</p>}
            </div>
        </BrowserRouter>
    );
}

export default App;
