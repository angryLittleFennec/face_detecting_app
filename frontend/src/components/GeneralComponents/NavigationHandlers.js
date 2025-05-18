import { useNavigate } from 'react-router-dom';

const NavigationHandlers = () => {
    const navigate = useNavigate();

    // Функция для удаления куки
    function eraseCookie(name) {
        document.cookie = name + '=; Max-Age=-99999999;';
    }

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
        eraseCookie('authToken');
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
