import { useNavigate } from 'react-router-dom';

const NavigationHandlers = () => {
    const navigate = useNavigate();

    const goToProfileHandler = () => navigate('/profile');
    const goToCamerasHandler = () => navigate('/cameras');
    const goToSettingsHandler = () => navigate('/cameras/settings/main');
    const goToDetectionSettingsHandler = () =>
        navigate('/cameras/settings/detection');
    const goToFaceRecognitionSettingsPageHandler = () =>
        navigate('/cameras/settings/recognition');
    const goToNotificationSettingsHandler = () =>
        navigate('/cameras/settings/notification');
    const goToAdditionalSettingsHandler = () =>
        navigate('/cameras/settings/additional');
    const goToReportsHandler = () => navigate('/report');
    const goToDataHandler = () => navigate('/data');
    const goToFilesHandler = () => navigate('/files');
    const goToStaffHandler = () => navigate('/staff');
    const logoutHandler = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    return {
        goToProfileHandler,
        goToCamerasHandler,
        goToSettingsHandler,
        goToDetectionSettingsHandler,
        goToFaceRecognitionSettingsPageHandler,
        goToNotificationSettingsHandler,
        goToAdditionalSettingsHandler,
        goToReportsHandler,
        goToDataHandler,
        goToFilesHandler,
        goToStaffHandler,
        logoutHandler,
    };
};

export default NavigationHandlers;
