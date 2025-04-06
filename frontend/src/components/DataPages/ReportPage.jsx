import { useNavigate } from 'react-router-dom';
import ButtonWithTooltip from '../UI/ButtonWithTooltip';
import './ReportPage.css';

function ReportPage({ onLogout }) {
    const navigate = useNavigate();

    const logoutHandler = () => {
        onLogout();
        navigate('/');
    };

    const goToCamerasHandler = () => {
        navigate('/cameras');
    };

    return (
        <div className="page-container">
            <div className="main-content justify-content-center">
                <div div className="report-container">
                    <h1>Отчетность</h1>
                </div>
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

export default ReportPage;
