import { renderHook } from '@testing-library/react-hooks';
import { useNavigate } from 'react-router';
import { useAuth } from '../LoginForm/AuthContext';
import NavigationHandlers from './NavigationHandlers';

// Мокируем useNavigate и useAuth
jest.mock('react-router', () => ({
    useNavigate: jest.fn(),
}));

jest.mock('../LoginForm/AuthContext', () => ({
    useAuth: jest.fn(),
}));

describe('NavigationHandlers', () => {
    const mockNavigate = jest.fn();
    const mockLogout = jest.fn();

    beforeEach(() => {
        useNavigate.mockReturnValue(mockNavigate);
        useAuth.mockReturnValue({ logout: mockLogout });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should navigate to profile', () => {
        const { result } = renderHook(() => NavigationHandlers());

        result.current.goToProfileHandler();

        expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });

    it('should navigate to cameras', () => {
        const { result } = renderHook(() => NavigationHandlers());

        result.current.goToCamerasHandler();

        expect(mockNavigate).toHaveBeenCalledWith('/cameras');
    });

    it('should navigate to settings', () => {
        const { result } = renderHook(() => NavigationHandlers());

        result.current.goToSettingsHandler();

        expect(mockNavigate).toHaveBeenCalledWith('/cameras/settings/main');
    });

    it('should navigate to detection settings', () => {
        const { result } = renderHook(() => NavigationHandlers());

        result.current.goToDetectionSettingsHandler();

        expect(mockNavigate).toHaveBeenCalledWith(
            '/cameras/settings/detection'
        );
    });

    it('should navigate to face recognition settings', () => {
        const { result } = renderHook(() => NavigationHandlers());

        result.current.goToFaceRecognitionSettingsPageHandler();

        expect(mockNavigate).toHaveBeenCalledWith(
            '/cameras/settings/recognition'
        );
    });

    it('should navigate to additional settings', () => {
        const { result } = renderHook(() => NavigationHandlers());

        result.current.goToAdditionalSettingsHandler();

        expect(mockNavigate).toHaveBeenCalledWith(
            '/cameras/settings/additional'
        );
    });

    it('should navigate to streams settings', () => {
        const { result } = renderHook(() => NavigationHandlers());

        result.current.goToAdditionalSettingsHandler();

        expect(mockNavigate).toHaveBeenCalledWith('/cameras/settings/streams');
    });

    it('should navigate to report page', () => {
        const { result } = renderHook(() => NavigationHandlers());

        result.current.goToAdditionalSettingsHandler();

        expect(mockNavigate).toHaveBeenCalledWith('/report');
    });

    it('should navigate to staff page', () => {
        const { result } = renderHook(() => NavigationHandlers());

        result.current.goToAdditionalSettingsHandler();

        expect(mockNavigate).toHaveBeenCalledWith('/staff');
    });

    it('should log out and navigate to home', () => {
        const { result } = renderHook(() => NavigationHandlers());

        result.current.logoutHandler();

        expect(mockLogout).toHaveBeenCalled();
        expect(document.cookie).toContain('authToken=; Max-Age=-99999999;'); // Проверяем, что cookie очищен
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
});
