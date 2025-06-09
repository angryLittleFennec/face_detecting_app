import React from 'react';
import { createContext } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, BrowserRouter } from 'react-router';
import { AuthProvider, useAuth } from './components/LoginForm/AuthContext';
import App from './App';
import LoginForm from './components/LoginForm/LoginForm';
import ProfilePage from './components/Profile/ProfilePage';
import CamerasPage from './components/Cameras/CamerasPage';
import StaffPage from './components/DataPages/StaffPage';
import ReportPage from './components/DataPages/ReportPage';
import CamerasSettingsPage from './components/Cameras/Settings/CamerasSettingsPage';
import DetectionSettingsPage from './components/Cameras/Settings/DetectionSettingsPage';
import FaceRecognitionSettingsPage from './components/Cameras/Settings/FaceRecognitionSettingsPage';
import AdditionalSettingsPage from './components/Cameras/Settings/AdditionalSettingsPage';
import StreamsSettingsPage from './components/Cameras/Settings/StreamsSettingsPage';
import { getCookie, fetchCurrentUser } from './components/Cameras/Api';
import { Provider } from 'react-redux';
import store from './store';
import ProfileHandlers from './components/Profile/ProfileHandlers';

// Мокируем функцию getCookie
jest.mock('./components/Cameras/Api', () => ({
    getCookie: jest.fn(),
    fetchCurrentUser: jest.fn(),
}));

jest.mock('./components/Profile/ProfileHandlers', () => ({
    username: '',
    email: '',
    handleFetchCurrentUser: jest.fn(),
    handleChangeContact: jest.fn(),
    isEditingContact: false,
    isEditingAdditional: false,
    about: '',
    handleEditContactClick: jest.fn(),
    handleEditAdditionalClick: jest.fn(),
    handleChangeAdditional: jest.fn(),
    handleSaveContactClick: jest.fn(),
    handleSaveAdditionalClick: jest.fn(),
}));

// Мок для контекста аутентификации
const MockAuthProvider = ({ children, isAuthenticated }) => {
    const mockUseAuth = () => ({
        isAuthenticated,
    });

    return <AuthProvider value={mockUseAuth()}>{children}</AuthProvider>;
};

describe('App Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders LoginForm at root path when not authenticated', () => {
        getCookie.mockReturnValue(null);
        render(
            <MemoryRouter initialEntries={['/']}>
                <MockAuthProvider isAuthenticated={false}>
                    <App />
                </MockAuthProvider>
            </MemoryRouter>
        );

        expect(
            screen.getByRole('button', { name: /войти/i })
        ).toBeInTheDocument();
    });

    test('redirects to LoginForm when trying to access ProfilePage without authentication', () => {
        getCookie.mockReturnValue(null);
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/profile']}>
                    <MockAuthProvider isAuthenticated={false}>
                        <App />
                    </MockAuthProvider>
                </MemoryRouter>
            </Provider>
        );

        expect(
            screen.getByRole('button', { name: /войти/i })
        ).toBeInTheDocument();
    });

    // test('renders ProfilePage when authenticated', async () => {
    //     getCookie.mockReturnValue('some-token');
    //     render(
    //         <MemoryRouter initialEntries={['/profile']}>
    //             <MockAuthProvider isAuthenticated={true}>
    //                 <App />
    //             </MockAuthProvider>
    //         </MemoryRouter>
    //     );

    //     await waitFor(() => {
    //         expect(screen.getByText(/камерах/i)).toBeInTheDocument();
    //     });
    // });

    test('redirects to LoginForm when trying to access CamerasPage without authentication', () => {
        getCookie.mockReturnValue(null);
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/cameras']}>
                    <MockAuthProvider isAuthenticated={false}>
                        <App />
                    </MockAuthProvider>
                </MemoryRouter>
            </Provider>
        );

        expect(
            screen.getByRole('button', { name: /войти/i })
        ).toBeInTheDocument();
    });

    test('renders CamerasPage when authenticated', () => {
        getCookie.mockReturnValue('some-token');
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/cameras/:id']}>
                    <MockAuthProvider isAuthenticated={true}>
                        <App />
                    </MockAuthProvider>
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText(/камерах/i)).toBeInTheDocument();
    });

    test('redirects to LoginForm when trying to access CameraPage without authentication', () => {
        getCookie.mockReturnValue(null);
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/cameras/:id']}>
                    <MockAuthProvider isAuthenticated={false}>
                        <App />
                    </MockAuthProvider>
                </MemoryRouter>
            </Provider>
        );

        expect(
            screen.getByRole('button', { name: /войти/i })
        ).toBeInTheDocument();
    });

    test('renders CamerasSettingsPage when authenticated', () => {
        getCookie.mockReturnValue('some-token');
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/cameras/settings/main']}>
                    <MockAuthProvider isAuthenticated={true}>
                        <App />
                    </MockAuthProvider>
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText(/камерах/i)).toBeInTheDocument();
    });

    test('redirects to LoginForm when trying to access CamerasSettingsPage without authentication', () => {
        getCookie.mockReturnValue(null);
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/cameras/settings/main']}>
                    <MockAuthProvider isAuthenticated={false}>
                        <App />
                    </MockAuthProvider>
                </MemoryRouter>
            </Provider>
        );

        expect(
            screen.getByRole('button', { name: /войти/i })
        ).toBeInTheDocument();
    });

    test('renders StreamsSettingsPage when authenticated', () => {
        getCookie.mockReturnValue('some-token');
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/cameras/settings/streams']}>
                    <MockAuthProvider isAuthenticated={true}>
                        <App />
                    </MockAuthProvider>
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText(/стримов/i)).toBeInTheDocument();
    });

    test('redirects to LoginForm when trying to access StreamsSettingsPage without authentication', () => {
        getCookie.mockReturnValue(null);
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/cameras/settings/streams']}>
                    <MockAuthProvider isAuthenticated={false}>
                        <App />
                    </MockAuthProvider>
                </MemoryRouter>
            </Provider>
        );

        expect(
            screen.getByRole('button', { name: /войти/i })
        ).toBeInTheDocument();
    });

    test('renders DetectionSettingsPage when authenticated', () => {
        getCookie.mockReturnValue('some-token');
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/cameras/settings/detection']}>
                    <MockAuthProvider isAuthenticated={true}>
                        <App />
                    </MockAuthProvider>
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText(/камерах/i)).toBeInTheDocument();
    });

    test('redirects to LoginForm when trying to access DetectionSettingsPage without authentication', () => {
        getCookie.mockReturnValue(null);
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/cameras/settings/detection']}>
                    <MockAuthProvider isAuthenticated={false}>
                        <App />
                    </MockAuthProvider>
                </MemoryRouter>
            </Provider>
        );

        expect(
            screen.getByRole('button', { name: /войти/i })
        ).toBeInTheDocument();
    });

    test('renders FaceRecognitionSettingsPage when authenticated', () => {
        getCookie.mockReturnValue('some-token');
        render(
            <Provider store={store}>
                <MemoryRouter
                    initialEntries={['/cameras/settings/recognition']}
                >
                    <MockAuthProvider isAuthenticated={true}>
                        <App />
                    </MockAuthProvider>
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText(/камерах/i)).toBeInTheDocument();
    });

    test('redirects to LoginForm when trying to access FaceRecognitionSettingsPage without authentication', () => {
        getCookie.mockReturnValue(null);
        render(
            <Provider store={store}>
                <MemoryRouter
                    initialEntries={['/cameras/settings/recognition']}
                >
                    <MockAuthProvider isAuthenticated={false}>
                        <App />
                    </MockAuthProvider>
                </MemoryRouter>
            </Provider>
        );

        expect(
            screen.getByRole('button', { name: /войти/i })
        ).toBeInTheDocument();
    });

    // test('renders AdditionalSettingsPage when authenticated', () => {
    //     getCookie.mockReturnValue('some-token');
    //     render(
    //         <MemoryRouter initialEntries={['/cameras/settings/additional']}>
    //             <MockAuthProvider isAuthenticated={true}>
    //                 <App />
    //             </MockAuthProvider>
    //         </MemoryRouter>
    //     );

    //     expect(screen.getByText(/камерах/i)).toBeInTheDocument();
    // });

    test('redirects to LoginForm when trying to access AdditionalSettingsPage without authentication', () => {
        getCookie.mockReturnValue(null);
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/cameras/settings/additional']}>
                    <MockAuthProvider isAuthenticated={false}>
                        <App />
                    </MockAuthProvider>
                </MemoryRouter>
            </Provider>
        );

        expect(
            screen.getByRole('button', { name: /войти/i })
        ).toBeInTheDocument();
    });

    test('renders CamerasPage when authenticated', () => {
        getCookie.mockReturnValue('some-token');
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/cameras']}>
                    <MockAuthProvider isAuthenticated={true}>
                        <App />
                    </MockAuthProvider>
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText(/камерах/i)).toBeInTheDocument();
    });

    test('redirects to LoginForm when trying to access StaffPage without authentication', () => {
        getCookie.mockReturnValue(null);
        render(
            <MemoryRouter initialEntries={['/staff']}>
                <MockAuthProvider isAuthenticated={false}>
                    <App />
                </MockAuthProvider>
            </MemoryRouter>
        );

        expect(
            screen.getByRole('button', { name: /войти/i })
        ).toBeInTheDocument();
    });

    test('renders StaffPage when authenticated', () => {
        getCookie.mockReturnValue('some-token');
        render(
            <MemoryRouter initialEntries={['/staff']}>
                <MockAuthProvider isAuthenticated={true}>
                    <App />
                </MockAuthProvider>
            </MemoryRouter>
        );

        expect(screen.getByText(/сотрудниках/i)).toBeInTheDocument();
    });

    test('redirects to LoginForm when trying to access ReportPage without authentication', () => {
        getCookie.mockReturnValue(null);
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/report']}>
                    <MockAuthProvider isAuthenticated={false}>
                        <App />
                    </MockAuthProvider>
                </MemoryRouter>
            </Provider>
        );

        expect(
            screen.getByRole('button', { name: /войти/i })
        ).toBeInTheDocument();
    });

    test('renders ReportPage when authenticated', () => {
        getCookie.mockReturnValue('some-token');

        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/report']}>
                    <MockAuthProvider isAuthenticated={true}>
                        <App />
                    </MockAuthProvider>
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText(/камерах/i)).toBeInTheDocument();
    });
});
