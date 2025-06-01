// Навигация в рамках приложения
import { useNavigate } from 'react-router';

const NavigationHandlers = () => {
    const navigate = useNavigate();

    // Функция для удаления куки
    function eraseCookie(name) {
        document.cookie = name + '=; Max-Age=-99999999;';
    }

    // Хендлеры для навигации
    const goToProfileHandler = () => navigate('/profile');
    const goToCamerasHandler = () => navigate('/cameras');
    const goToSettingsHandler = () => navigate('/cameras/settings/main');
    const goToDetectionSettingsHandler = () =>
        navigate('/cameras/settings/detection');
    const goToFaceRecognitionSettingsPageHandler = () =>
        navigate('/cameras/settings/recognition');
    const goToAdditionalSettingsHandler = () =>
        navigate('/cameras/settings/additional');
    const goToStreamsSettingsHandler = () =>
        navigate('/cameras/settings/streams');
    const goToReportsHandler = () => navigate('/report');
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
        goToAdditionalSettingsHandler,
        goToStreamsSettingsHandler,
        goToReportsHandler,
        goToStaffHandler,
        logoutHandler,
    };
};

export default NavigationHandlers;
