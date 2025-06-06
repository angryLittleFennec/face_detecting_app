// Страница для просмотра и скачивания загруженных файлов
import { useEffect } from 'react';
import DataHandlers from './DataHandlers';
import LogsFilterWindow from './LogsFilterWindow';
import CamerasHandlers from '../Cameras/CamerasHandlers';
import NavigationHandlers from '../GeneralComponents/NavigationHandlers';
import ButtonWithTooltip from '../UI/ButtonWithTooltip';
import IconButton from '../UI/IconButton';
import './ReportPage.css';

function ReportPage() {
    const { goToCamerasHandler, logoutHandler } = NavigationHandlers();

    const { loading, error, setLoading, handleFetchCameras } =
        CamerasHandlers();

    const {
        files,
        selectedLogIndex,
        isLogsFilterWindowOpen,
        handleFetchLogsList,
        handleDownloadLogs,
        handleLogClick,
        openLogsFilterWindow,
        closeLogsFilterWindow,
        handleFetchPersons,
        handleSendEmail,
    } = DataHandlers();

    useEffect(() => {
        const fetchData = async () => {
            await handleFetchLogsList();
            setLoading(false);
        };

        fetchData();
    }, []);

    if (loading) {
        handleFetchCameras();
        handleFetchPersons();
        return <h2>Загрузка...</h2>;
    }

    if (error) {
        return <h2>Ошибка: {error}</h2>;
    }

    return (
        <div className="page-container">
            <div className="main-content justify-content-center">
                <div className="report-container">
                    <div>
                        <h1>Список событий</h1>
                        <ul className="files-list">
                            {files.map((file, index) => (
                                <div>
                                    <div className="files-list-element">
                                        <img
                                            src={
                                                selectedLogIndex === index
                                                    ? '/icons/list-element-active.png'
                                                    : '/icons/list-element.png'
                                            }
                                            alt="элемент списка"
                                        />
                                        <li
                                            onClick={() =>
                                                handleLogClick(index)
                                            }
                                            key={index}
                                        >
                                            Событие №{file.id}
                                        </li>
                                    </div>
                                    {selectedLogIndex === index && (
                                        <div className="event-description">
                                            <p>
                                                Тип события: {file.event_type}
                                            </p>
                                            <p>
                                                Время события: {file.timestamp}
                                            </p>
                                            <p>Сотрудник: {file.person_id}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </ul>
                    </div>
                    <div className="report-page-buttons">
                        <button
                            onClick={() => handleDownloadLogs()}
                            className="report-container-button"
                        >
                            Скачать
                        </button>
                        <IconButton
                            onClick={openLogsFilterWindow}
                            iconSrc="/icons/filter-icon.png"
                            altText="фильтрация"
                            className="filter-icon-button"
                        />
                        <ButtonWithTooltip
                            className="email-icon-button"
                            iconSrc="/icons/email-icon.png"
                            altText={
                                <>
                                    Отправка событий <br /> на почту
                                </>
                            }
                            onClick={handleSendEmail}
                        />
                    </div>
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
                <LogsFilterWindow
                    isOpen={isLogsFilterWindowOpen}
                    onClose={closeLogsFilterWindow}
                />
            </div>
        </div>
    );
}

export default ReportPage;
