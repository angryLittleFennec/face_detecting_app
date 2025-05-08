import NavigationHandlers from '../GeneralComponents/NavigationHandlers';
import ButtonWithTooltip from '../UI/ButtonWithTooltip';
import FileUploadButton from '../UI/FileUploadButton';
import './DownloadDataPage.css';

function DownloadDataPage() {
    const {
        goToCamerasHandler,
        goToFilesHandler,
        goToStaffHandler,
        goToDataHandler,
        logoutHandler,
    } = NavigationHandlers();

    return (
        <div className="page-container">
            <div className="main-content justify-content-center">
                <div className="download-data-container">
                    <h1>Загрузите нужный файл</h1>
                    <FileUploadButton />
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

export default DownloadDataPage;
