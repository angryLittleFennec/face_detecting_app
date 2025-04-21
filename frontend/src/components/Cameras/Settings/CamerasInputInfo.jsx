import './CamerasInputInfo.css';

const CamerasInputInfo = ({ newCamera, setNewCamera }) => {
    return (
        <div className="cameras-input-info-container">
            <input
                className="text-input"
                type="text"
                placeholder="Название камеры"
                value={newCamera.name}
                onChange={(e) =>
                    setNewCamera({
                        ...newCamera,
                        name: e.target.value,
                    })
                }
            />
            <input
                className="text-input"
                type="text"
                placeholder="URL видео"
                value={newCamera.url}
                onChange={(e) =>
                    setNewCamera({
                        ...newCamera,
                        url: e.target.value,
                    })
                }
            />
            <input
                className="text-input"
                type="text"
                placeholder="Описание"
                value={newCamera.description}
                onChange={(e) =>
                    setNewCamera({
                        ...newCamera,
                        description: e.target.value,
                    })
                }
            />
            <br />
            <label>
                Активна:
                <input
                    className="checkbox-input"
                    type="checkbox"
                    checked={newCamera.is_active}
                    onChange={(e) => {
                        const isActive = e.target.checked;
                        setNewCamera({ ...newCamera, is_active: isActive });
                    }}
                />
            </label>
        </div>
    );
};

export default CamerasInputInfo;
