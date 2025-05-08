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
import DetectionSettingsPage from './components/Cameras/Settings/DetectionSettingsPage';
import FaceRecognitionSettingsPage from './components/Cameras/Settings/FaceRecognitionSettingsPage';
import NotificationSettingsPage from './components/Cameras/Settings/NotificationSettingsPage';
import AdditionalSettingsPage from './components/Cameras/Settings/AdditionalSettingsPage';
import './App.css';

function App() {
    const isAuthenticated = () => {
        const token = localStorage.getItem('token');
        return !!token;
    };

    return (
        <BrowserRouter>
            <div className="App">
                <Routes>
                    <Route path="/" element={<LoginForm />} />
                    <Route
                        path="/profile"
                        element={
                            isAuthenticated() ? (
                                <ProfilePage />
                            ) : (
                                <Navigate to="/" />
                            )
                        }
                    />
                    <Route
                        path="/cameras"
                        element={
                            isAuthenticated() ? (
                                <>
                                    <CamerasPage />
                                </>
                            ) : (
                                <Navigate to="/" />
                            )
                        }
                    />
                    <Route
                        path="/cameras/:id"
                        element={
                            isAuthenticated() ? (
                                <>
                                    <CameraPage />
                                </>
                            ) : (
                                <Navigate to="/" />
                            )
                        }
                    />
                    <Route
                        path="/cameras/settings/main"
                        element={
                            isAuthenticated() ? (
                                <>
                                    <CamerasSettingsPage />
                                </>
                            ) : (
                                <Navigate to="/" />
                            )
                        }
                    />
                    <Route
                        path="/cameras/settings/detection"
                        element={
                            isAuthenticated() ? (
                                <>
                                    <DetectionSettingsPage />
                                </>
                            ) : (
                                <Navigate to="/" />
                            )
                        }
                    />
                    <Route
                        path="/cameras/settings/recognition"
                        element={
                            isAuthenticated() ? (
                                <>
                                    <FaceRecognitionSettingsPage />
                                </>
                            ) : (
                                <Navigate to="/" />
                            )
                        }
                    />
                    <Route
                        path="/cameras/settings/notification"
                        element={
                            isAuthenticated() ? (
                                <>
                                    <NotificationSettingsPage />
                                </>
                            ) : (
                                <Navigate to="/" />
                            )
                        }
                    />
                    <Route
                        path="/cameras/settings/additional"
                        element={
                            isAuthenticated() ? (
                                <>
                                    <AdditionalSettingsPage />
                                </>
                            ) : (
                                <Navigate to="/" />
                            )
                        }
                    />
                    <Route
                        path="/data"
                        element={
                            isAuthenticated() ? (
                                <>
                                    <DownloadDataPage />
                                </>
                            ) : (
                                <Navigate to="/" />
                            )
                        }
                    />
                    <Route
                        path="/files"
                        element={
                            isAuthenticated() ? (
                                <>
                                    <FilesListPage />
                                </>
                            ) : (
                                <Navigate to="/" />
                            )
                        }
                    />
                    <Route
                        path="/staff"
                        element={
                            isAuthenticated() ? (
                                <>
                                    <StaffPage />
                                </>
                            ) : (
                                <Navigate to="/" />
                            )
                        }
                    />
                    <Route
                        path="/report"
                        element={
                            isAuthenticated() ? (
                                <>
                                    <ReportPage />
                                </>
                            ) : (
                                <Navigate to="/" />
                            )
                        }
                    />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
