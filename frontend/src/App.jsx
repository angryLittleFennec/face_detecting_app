import { Routes, Route, Navigate } from 'react-router';
import { getCookie } from './components/Cameras/Api';
import LoginForm from './components/LoginForm/LoginForm';
import ProfilePage from './components/Profile/ProfilePage';
import CamerasPage from './components/Cameras/CamerasPage';
import CameraPage from './components/Cameras/CameraPage';
import StaffPage from './components/DataPages/StaffPage';
import ReportPage from './components/DataPages/ReportPage';
import CamerasSettingsPage from './components/Cameras/Settings/CamerasSettingsPage';
import DetectionSettingsPage from './components/Cameras/Settings/DetectionSettingsPage';
import FaceRecognitionSettingsPage from './components/Cameras/Settings/FaceRecognitionSettingsPage';
import AdditionalSettingsPage from './components/Cameras/Settings/AdditionalSettingsPage';
import StreamsSettingsPage from './components/Cameras/Settings/StreamsSettingsPage';
import './App.css';

function App() {
    // Роутинг в рамках приложения
    return (
        <div className="App">
            <Routes>
                <Route path="/" element={<LoginForm />} />
                <Route
                    path="/profile"
                    element={
                        getCookie('authToken') ? (
                            <ProfilePage />
                        ) : (
                            <Navigate to="/" />
                        )
                    }
                />
                <Route
                    path="/cameras"
                    element={
                        getCookie('authToken') ? (
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
                        getCookie('authToken') ? (
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
                        getCookie('authToken') ? (
                            <>
                                <CamerasSettingsPage />
                            </>
                        ) : (
                            <Navigate to="/" />
                        )
                    }
                />
                <Route
                    path="/cameras/settings/streams"
                    element={
                        getCookie('authToken') ? (
                            <>
                                <StreamsSettingsPage />
                            </>
                        ) : (
                            <Navigate to="/" />
                        )
                    }
                />
                <Route
                    path="/cameras/settings/detection"
                    element={
                        getCookie('authToken') ? (
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
                        getCookie('authToken') ? (
                            <>
                                <FaceRecognitionSettingsPage />
                            </>
                        ) : (
                            <Navigate to="/" />
                        )
                    }
                />
                <Route
                    path="/cameras/settings/additional"
                    element={
                        getCookie('authToken') ? (
                            <>
                                <AdditionalSettingsPage />
                            </>
                        ) : (
                            <Navigate to="/" />
                        )
                    }
                />
                <Route
                    path="/staff"
                    element={
                        getCookie('authToken') ? (
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
                        getCookie('authToken') ? (
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
    );
}

export default App;
