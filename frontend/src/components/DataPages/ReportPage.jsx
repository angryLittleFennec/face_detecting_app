import DataHandlers from './DataHandlers';
import NavigationHandlers from '../GeneralComponents/NavigationHandlers';
import ButtonWithTooltip from '../UI/ButtonWithTooltip';
import './ReportPage.css';

function ReportPage() {
    const { goToCamerasHandler, logoutHandler } = NavigationHandlers();

    const { files, handleDownload } = DataHandlers();

    return (
        <div className="page-container">
            <div className="main-content justify-content-center">
                <div div className="report-container">
                    <div>
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
                    <ul>
                        <li>
                            {files.length > 0 ? (
                                <div>
                                    <button
                                        onClick={() => handleDownload(files[0])}
                                    >
                                        Скачать
                                    </button>
                                </div>
                            ) : (
                                <div></div>
                            )}
                        </li>
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

export default ReportPage;
