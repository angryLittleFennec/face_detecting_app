import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CameraSettingsWindow from './CameraSettingsWindow';
import Dropdown from '../UI/Dropdown';
import ButtonWithTooltip from '../UI/ButtonWithTooltip';
import modelOptions from './ModelOptions';
import trackingOptions from './TrackingOptions';
import staffOptions from './StaffOptions';
import './CameraPage.css';

function CameraPage({ onLogout }) {
    const navigate = useNavigate();
    const { id } = useParams();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const logoutHandler = () => {
        onLogout();
        navigate('/');
    };

    const goToCamerasHandler = () => {
        navigate('/cameras');
    };

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="page-container">
            <div className="main-content margin-right-600 margin-bottom-250">
                <h1>Камера №{id}</h1>
            </div>
            <div className="left-menu">
                <div className="top-menu-part">
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/back-icon-white.png"
                        altText="Назад"
                        tooltipText="Назад"
                        onClick={goToCamerasHandler}
                    />
                </div>
                <div className="bottom-menu-part">
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/settings-icon-white.png"
                        altText="Настройка камер"
                        tooltipText="Настройка камер"
                        onClick={openModal}
                    />
                    <ButtonWithTooltip
                        className="icon-button"
                        iconSrc="/icons/exit-icon-white.png"
                        altText="Выход"
                        tooltipText="Выход"
                        onClick={logoutHandler}
                    />
                </div>
                <CameraSettingsWindow
                    isOpen={isModalOpen}
                    onClose={closeModal}
                />
            </div>
            <div className="results">
                <h2>Результаты идентификации</h2>
            </div>
            <div className="filters">
                <Dropdown children={modelOptions} text="Выбор модель" />
                <Dropdown children={trackingOptions} text="Виды трекинга" />
                <Dropdown children={staffOptions} text="Выбор сотрудника" />
            </div>
            <div className="faces-feed">
                <h2>Лента выявленных лиц</h2>
            </div>
        </div>
    );
}

export default CameraPage;
