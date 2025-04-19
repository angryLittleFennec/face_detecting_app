import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './components/LoginForm/LoginForm';
import ProfilePage from './components/Profile/ProfilePage';
import CamerasPage from './components/Cameras/CamerasPage';
import CameraPage from './components/Cameras/CameraPage';
import DownloadDataPage from './components/DataPages/DownloadDataPage';
import FilesListPage from './components/DataPages/FilesListPage';
import StaffPage from './components/DataPages/StaffPage';
import ReportPage from './components/DataPages/ReportPage';
import CamerasSettingsPage from './components/Cameras/Settings/CamerasSettingsPage';
import NotificationSettingsPage from './components/Cameras/Settings/NotificationSettingsPage';
import AdditionalSettingsPage from './components/Cameras/Settings/AdditionalSettingsPage';
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
                            <ProfilePage onLogout={handleLogout} />
                            //isLoggedIn ? (<ProfilePage onLogout={handleLogout} />) : (<Navigate to="/" />)
                        }
                    />
                    <Route
                        path="/cameras"
                        element={
                            <CamerasPage onLogout={handleLogout} />
                            //isLoggedIn ? (<CamerasPage onLogout={handleLogout} />) : (<Navigate to="/" />)
                        }
                    />
                    <Route
                        path="/cameras/:id"
                        element={
                            <CameraPage onLogout={handleLogout} />
                            //isLoggedIn ? (<CameraPage onLogout={handleLogout} />) : (<Navigate to="/" />)
                        }
                    />
                    <Route
                        path="/cameras/settings/main"
                        element={
                            <CamerasSettingsPage onLogout={handleLogout} />
                            //isLoggedIn ? (<CamerasSettingsPage onLogout={handleLogout} />) : (<Navigate to="/" />)
                        }
                    />
                    <Route
                        path="/cameras/settings/notification"
                        element={
                            <NotificationSettingsPage onLogout={handleLogout} />
                            //isLoggedIn ? (<CamerasSettingsPage onLogout={handleLogout} />) : (<Navigate to="/" />)
                        }
                    />
                    <Route
                        path="/cameras/settings/additional"
                        element={
                            <AdditionalSettingsPage onLogout={handleLogout} />
                            //isLoggedIn ? (<CamerasSettingsPage onLogout={handleLogout} />) : (<Navigate to="/" />)
                        }
                    />
                    <Route
                        path="/data"
                        element={
                            <DownloadDataPage onLogout={handleLogout} />
                            //isLoggedIn ? (<DownloadDataPage onLogout={handleLogout} />) : (<Navigate to="/" />)
                        }
                    />
                    <Route
                        path="/files"
                        element={
                            <FilesListPage onLogout={handleLogout} />
                            //isLoggedIn ? (<FilesListPage onLogout={handleLogout} />) : (<Navigate to="/" />)
                        }
                    />
                    <Route
                        path="/staff"
                        element={
                            <StaffPage onLogout={handleLogout} />
                            //isLoggedIn ? (<StaffPage onLogout={handleLogout} />) : (<Navigate to="/" />)
                        }
                    />
                    <Route
                        path="/report"
                        element={
                            <ReportPage onLogout={handleLogout} />
                            //isLoggedIn ? (<ReportPage onLogout={handleLogout} />) : (<Navigate to="/" />)
                        }
                    />
                </Routes>
                {message && <p className="error-text">{message}</p>}
            </div>
        </BrowserRouter>
    );
}

export default App;
