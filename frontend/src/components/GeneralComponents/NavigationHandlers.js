import { useNavigate } from 'react-router-dom';

const NavigationHandlers = (onLogout) => {
    const navigate = useNavigate();

    const goToProfileHandler = () => navigate('/profile');
    const goToCamerasHandler = () => navigate('/cameras');
    const goToSettingsHandler = () => navigate('/cameras/settings/main');
    const goToNotificationSettingsHandler = () =>
        navigate('/cameras/settings/notification');
    const goToAdditionalSettingsHandler = () =>
        navigate('/cameras/settings/additional');
    const goToReportsHandler = () => navigate('/report');
    const goToDataHandler = () => navigate('/data');
    const goToFilesHandler = () => navigate('/files');
    const goToStaffHandler = () => navigate('/staff');
    const logoutHandler = () => {
        onLogout();
        navigate('/');
    };

    return {
        goToProfileHandler,
        goToCamerasHandler,
        goToSettingsHandler,
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
