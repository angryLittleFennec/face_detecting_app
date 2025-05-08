import { useState } from 'react';

const RecognitionThresholdSettings = () => {
    const [faceRecognitionThreshold, setFaceRecognitionThreshold] =
        useState(0.8);
    const [similarityThreshold, setSimilarityThreshold] = useState(0.8);

    const handleSaveSettings = () => {
        // Сохранение настроек (например, в локальном хранилище или на сервере)
        console.log('Настройки сохранены:', {
            faceRecognitionThreshold,
            similarityThreshold,
        });
    };

    return (
        <div className="face-recognition-settings-container">
            <div className="threshold-container">
                <label>
                    Порог уверенности для распознавания лиц:
                    <input
                        className="number-input"
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={faceRecognitionThreshold}
                        onChange={(e) =>
                            setFaceRecognitionThreshold(
                                parseFloat(e.target.value)
                            )
                        }
                    />
                </label>
                <label>
                    Порог схожести лиц (similarity threshold):
                    <input
                        className="number-input"
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={similarityThreshold}
                        onChange={(e) =>
                            setSimilarityThreshold(parseFloat(e.target.value))
                        }
                    />
                </label>
            </div>
            <button onClick={handleSaveSettings}>Сохранить настройки</button>
        </div>
    );
};

export default RecognitionThresholdSettings;
