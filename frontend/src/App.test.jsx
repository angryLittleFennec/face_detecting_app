import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import App from './App';
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

jest.mock('./LoginForm', () => (props) => (
    <div>
        <button onClick={() => props.onLoginSuccess('Login successful!')}>
            Login
        </button>
    </div>
));

jest.mock('./ProfilePage', () => (props) => (
    <div>
        <h1>Profile Page</h1>
        <button onClick={props.onLogout}>Logout</button>
    </div>
));

jest.mock('./CamerasPage', () => (props) => (
    <div>
        <h1>Cameras Page</h1>
        <button onClick={props.onLogout}>Logout</button>
    </div>
));

jest.mock('./CameraPage', () => (props) => (
    <div>
        <h1>Camera Page</h1>
        <button onClick={props.onLogout}>Logout</button>
    </div>
));

jest.mock('./CamerasSettingsPage', () => (props) => (
    <div>
        <h1>Cameras Settings Page</h1>
        <button onClick={props.onLogout}>Logout</button>
    </div>
));

jest.mock('./NotificationSettingsPage', () => (props) => (
    <div>
        <h1>Notification Settings Page</h1>
        <button onClick={props.onLogout}>Logout</button>
    </div>
));

jest.mock('./AdditionalSettingsPage', () => (props) => (
    <div>
        <h1>Additional Settings Page</h1>
        <button onClick={props.onLogout}>Logout</button>
    </div>
));

jest.mock('./DownloadDataPage', () => (props) => (
    <div>
        <h1>Download Data Page</h1>
        <button onClick={props.onLogout}>Logout</button>
    </div>
));

jest.mock('./FilesListPage', () => (props) => (
    <div>
        <h1>Files List Page</h1>
        <button onClick={props.onLogout}>Logout</button>
    </div>
));

jest.mock('./StaffPage', () => (props) => (
    <div>
        <h1>Staff Page</h1>
        <button onClick={props.onLogout}>Logout</button>
    </div>
));

jest.mock('./ReportPage', () => (props) => (
    <div>
        <h1>Report Page</h1>
        <button onClick={props.onLogout}>Logout</button>
    </div>
));

describe('App Component', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('renders LoginForm on initial load', () => {
        render(<App />);
        expect(screen.getByText(/login/i)).toBeInTheDocument();
    });

    test('logs in user and navigates to profile page', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText(/login/i));
        expect(screen.getByText(/profile page/i)).toBeInTheDocument();
        expect(localStorage.getItem('isLoggedIn')).toBe('true');
    });

    test('logs out user and returns to login page', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText(/login/i));
        fireEvent.click(screen.getByText(/logout/i));

        expect(screen.getByText(/login/i)).toBeInTheDocument();
        expect(localStorage.getItem('isLoggedIn')).toBeNull();
    });

    test('logs in user and navigates to cameras page', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText(/login/i));
        expect(screen.getByText(/cameras page/i)).toBeInTheDocument();
        expect(localStorage.getItem('isLoggedIn')).toBe('true');
    });

    test('logs in user and navigates to camera page', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText(/login/i));
        expect(screen.getByText(/camera page/i)).toBeInTheDocument();
        expect(localStorage.getItem('isLoggedIn')).toBe('true');
    });
});
