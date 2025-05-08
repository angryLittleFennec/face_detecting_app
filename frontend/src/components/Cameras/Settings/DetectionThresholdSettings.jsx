import { useState } from 'react';

const DetectionThresholdSettings = () => {
    const [faceDetectionThreshold, setFaceDetectionThreshold] = useState(0.7);
    const [silhouetteDetectionThreshold, setSilhouetteDetectionThreshold] =
        useState(0.7);
    const [iouThreshold, setIouThreshold] = useState(0.8);

    const handleSaveSettings = () => {
        // Сохранение настроек (например, в локальном хранилище или на сервере)
        console.log('Настройки сохранены:', {
            faceDetectionThreshold,
            silhouetteDetectionThreshold,
            iouThreshold,
        });
    };

    return (
        <div className="detection-settings-container">
            <div className="threshold-container">
                <label>
                    Порог уверенности для детекции лиц:
                    <input
                        className="number-input"
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={faceDetectionThreshold}
                        onChange={(e) =>
                            setFaceDetectionThreshold(
                                parseFloat(e.target.value)
                            )
                        }
                    />
                </label>
                <label>
                    Порог уверенности для детекции силуэтов:
                    <input
                        className="number-input"
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={silhouetteDetectionThreshold}
                        onChange={(e) =>
                            setSilhouetteDetectionThreshold(
                                parseFloat(e.target.value)
                            )
                        }
                    />
                </label>
                <label>
                    Intersection over Union (IoU):
                    <input
                        className="number-input"
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={iouThreshold}
                        onChange={(e) =>
                            setIouThreshold(parseFloat(e.target.value))
                        }
                    />
                </label>
            </div>
            <button onClick={handleSaveSettings}>Сохранить настройки</button>
        </div>
    );
};

export default DetectionThresholdSettings;
