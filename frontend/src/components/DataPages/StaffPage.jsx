import { useNavigate } from 'react-router-dom';
import ButtonWithTooltip from '../UI/ButtonWithTooltip';
import './StaffPage.css';

function StaffPage({ onLogout }) {
    const navigate = useNavigate();

    const logoutHandler = () => {
        onLogout();
        navigate('/');
    };

    const goToCamerasHandler = () => {
        navigate('/cameras');
    };

    const goToDownloadHandler = () => {
        navigate('/data');
    };

    const goToFilesHandler = () => {
        navigate('/files');
    };

    const goToStaffHandler = () => {
        navigate('/staff');
    };

    return (
        <div className="page-container">
            <div className="main-content">
                <h1>Список сотрудников</h1>
            </div>
            <div className="left-menu">
                <div className="top-menu-part">
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/back-icon-white.png"
                        altText="Назад"
                        tooltipText="Назад"
                        onClick={goToCamerasHandler}
                    />
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/files-upload-icon-white.png"
                        altText="Загрузка файлов"
                        tooltipText="Загрузка файлов"
                        onClick={goToDownloadHandler}
                    />
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/files-icon-white.png"
                        altText="Список файлов"
                        tooltipText="Список файлов"
                        onClick={goToFilesHandler}
                    />
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/staff-icon-white.png"
                        altText="Сотрудники"
                        tooltipText="Сотрудники"
                        onClick={goToStaffHandler}
                    />
                </div>
                <div className="bottom-menu-part">
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/exit-icon-white.png"
                        altText="Выход"
                        tooltipText="Выход"
                        onClick={logoutHandler}
                    />
                </div>
            </div>
        </div>
    );
}

export default StaffPage;
