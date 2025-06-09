// Контейнер с камерами
import { useSelector } from 'react-redux';
import CamerasHandlers from './CamerasHandlers';
import DataHandlers from '../DataPages/DataHandlers';
import HlsPlayer from './HlsPlayer';
import './CamerasContainer.css';

const CamerasContainer = (props) => {
    const { currentCameras, camerasLocation, startIndex } = props;
    const { loading, error, streams, handleFetchCameras, handleSelectCamera } =
        CamerasHandlers();
    const { getStreamUrl } = DataHandlers();

    const selectedCameraIndex = useSelector(
        (state) => state.selectedCameraIndex
    );

    // Получение камер перед загрузкой страницы
    if (loading) {
        handleFetchCameras();
        return <h2>Загрузка...</h2>;
    }

    if (error) {
        return <h2>Ошибка: {error}</h2>;
    }

    return (
        <div
            className={
                camerasLocation === 'first'
                    ? 'cameras-container-one'
                    : 'cameras-container-many'
            }
        >
            {currentCameras.length > 0 && camerasLocation === 'third' ? (
                <>
                    {/* Большая камера */}
                    {
                        <div className="cameras-row">
                            <div
                                className="cameras-third-location-big"
                                onClick={() => handleSelectCamera(startIndex)}
                                style={{
                                    border:
                                        selectedCameraIndex === startIndex
                                            ? '2px solid blue'
                                            : 'none',
                                }}
                            >
                                <HlsPlayer
                                    url={getStreamUrl(
                                        currentCameras[0].id,
                                        streams
                                    )}
                                />
                            </div>
                            <div className="cameras-column">
                                {currentCameras
                                    .slice(1, 3)
                                    .map((camera, index) => (
                                        <div
                                            key={startIndex + index + 1}
                                            className="cameras-third-location-small-right"
                                            onClick={() =>
                                                handleSelectCamera(
                                                    startIndex + index + 1
                                                )
                                            }
                                            style={{
                                                border:
                                                    selectedCameraIndex ===
                                                    startIndex + index + 1
                                                        ? '2px solid blue'
                                                        : 'none',
                                            }}
                                        >
                                            <HlsPlayer
                                                url={getStreamUrl(
                                                    currentCameras[0].id,
                                                    streams
                                                )}
                                            />
                                        </div>
                                    ))}
                            </div>
                        </div>
                    }

                    {/* Три маленькие камеры */}
                    <div className="cameras-row">
                        {currentCameras.slice(3, 6).map((camera, index) => (
                            <div
                                key={startIndex + index + 3}
                                className="cameras-third-location-small"
                                onClick={() =>
                                    handleSelectCamera(startIndex + index + 3)
                                }
                                style={{
                                    border:
                                        selectedCameraIndex ===
                                        startIndex + index + 3
                                            ? '2px solid blue'
                                            : 'none',
                                }}
                            >
                                <HlsPlayer
                                    url={getStreamUrl(
                                        currentCameras[0].id,
                                        streams
                                    )}
                                />
                            </div>
                        ))}
                    </div>
                </>
            ) : currentCameras.length > 0 ? (
                currentCameras.map((camera, index) => (
                    <div
                        key={startIndex + index}
                        className={
                            camerasLocation === 'first'
                                ? 'cameras-first-location'
                                : camerasLocation === 'second'
                                ? 'cameras-second-location'
                                : camerasLocation === 'fourth'
                                ? 'cameras-fourth-location'
                                : index === 0
                                ? 'cameras-third-location-big'
                                : 'cameras-third-location-small'
                        }
                        onClick={() => handleSelectCamera(startIndex + index)}
                        style={{
                            border:
                                selectedCameraIndex === startIndex + index
                                    ? '2px solid blue'
                                    : 'none',
                        }}
                    >
                        <HlsPlayer
                            url={getStreamUrl(currentCameras[0].id, streams)}
                        />
                    </div>
                ))
            ) : (
                <h1>Камеры не найдены</h1>
            )}
        </div>
    );
};

export default CamerasContainer;
