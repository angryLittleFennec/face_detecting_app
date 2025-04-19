import NavigationHandlers from '../GeneralComponents/NavigationHandlers';
import ButtonWithTooltip from '../UI/ButtonWithTooltip';
import './StaffPage.css';

function StaffPage({ onLogout }) {
    const {
        goToCamerasHandler,
        goToFilesHandler,
        goToStaffHandler,
        goToDataHandler,
        logoutHandler,
    } = NavigationHandlers(onLogout);

    return (
        <div className="page-container">
            <div className="main-content justify-content-center">
                <div div className="staff-container">
                    <h1>Список сотрудников</h1>
                    <p>Здесь будет отображаться список сотрудников...</p>
                </div>
            </div>
            <div className="left-menu">
                <div className="top-menu-part">
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/back-icon-white.png"
                        altText="Назад"
                        onClick={goToCamerasHandler}
                    />
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/files-upload-icon-white.png"
                        altText="Загрузка файлов"
                        onClick={goToDataHandler}
                    />
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/files-icon-white.png"
                        altText="Список файлов"
                        onClick={goToFilesHandler}
                    />
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/staff-icon-white.png"
                        altText="Сотрудники"
                        onClick={goToStaffHandler}
                    />
                </div>
                <div className="bottom-menu-part">
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/exit-icon-white.png"
                        altText="Выход"
                        onClick={logoutHandler}
                    />
                </div>
            </div>
        </div>
    );
}

export default StaffPage;
