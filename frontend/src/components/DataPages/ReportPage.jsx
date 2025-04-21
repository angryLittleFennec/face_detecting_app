import { useEffect } from 'react';
import DataHandlers from './DataHandlers';
import NavigationHandlers from '../GeneralComponents/NavigationHandlers';
import PdfViewer from '../GeneralComponents/PdfViewer';
import ButtonWithTooltip from '../UI/ButtonWithTooltip';
import './ReportPage.css';

function ReportPage({ onLogout }) {
    const { goToCamerasHandler, logoutHandler } = NavigationHandlers(onLogout);

    const { files, extractText, handleDownload } = DataHandlers();

    return (
        <div className="page-container">
            <div className="main-content justify-content-center">
                <div div className="report-container">
                    <div>
                        <h1>Отчётность</h1>
                        {files.length > 0 ? (
                            <PdfViewer value={files[0]} />
                        ) : (
                            <p>Логи отсутствуют</p>
                        )}
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
