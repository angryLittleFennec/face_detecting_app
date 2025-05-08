import { useSelector } from 'react-redux';
import NavigationHandlers from '../GeneralComponents/NavigationHandlers';
import ButtonWithTooltip from '../UI/ButtonWithTooltip';
import './FilesListPage.css';

function FileListPage() {
    const files = useSelector((state) => state.files);

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
                <div div className="files-list-container">
                    <h1>Список файлов</h1>
                    <ul className="files-list">
                        {files.length > 0 ? (
                            files.map((file, index) => (
                                <div className="files-list-element">
                                    <img
                                        src={'/icons/list-element.png'}
                                        alt="элемент списка"
                                    />
                                    <li key={index}>{file.name}</li>
                                </div>
                            ))
                        ) : (
                            <div>
                                <p>Файлы отсутствуют</p>
                            </div>
                        )}
                    </ul>
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

export default FileListPage;
