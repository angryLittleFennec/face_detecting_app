import React, { useState } from 'react';
import NavigationHandlers from '../GeneralComponents/NavigationHandlers';
import ButtonWithTooltip from '../UI/ButtonWithTooltip';
import './ProfilePage.css';

function ProfilePage() {
    const [isEditingMain, setIsEditingMain] = useState(false);
    const [isEditingContact, setIsEditingContact] = useState(false);
    const [isEditingAdditional, setIsEditingAdditional] = useState(false);
    const [profileInfo, setProfileInfo] = useState({
        firstName: 'Админ',
        lastName: 'Админов',
        middleName: 'Админович',
        position: 'безработный',
        email: 'example@email.com',
        phone: '+79876543210',
        about: 'пусто',
    });

    const { goToCamerasHandler, logoutHandler } = NavigationHandlers();

    const handleEditMainClick = () => {
        setIsEditingMain(true);
    };

    const handleEditContactClick = () => {
        setIsEditingContact(true);
    };

    const handleEditAdditionalClick = () => {
        setIsEditingAdditional(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileInfo({ ...profileInfo, [name]: value });
    };

    const handleSaveMainClick = () => {
        setIsEditingMain(false);
        // Здесь можно добавить код для сохранения данных на сервер
    };

    const handleSaveContactClick = () => {
        setIsEditingContact(false);
        // Здесь можно добавить код для сохранения данных на сервер
    };

    const handleSaveAdditionalClick = () => {
        setIsEditingAdditional(false);
        // Здесь можно добавить код для сохранения данных на сервер
    };

    return (
        <div className="page-container">
            <div className="profile-main-content">
                <div className="profile-container-250px">
                    <h2>Основная информация</h2>
                    {isEditingMain ? (
                        <>
                            <div className="profile-field">
                                <p>Имя: </p>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={profileInfo.firstName}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="profile-field">
                                <p>Фамилия: </p>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={profileInfo.lastName}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="profile-field">
                                <p>Отчество: </p>
                                <input
                                    type="text"
                                    name="middleName"
                                    value={profileInfo.middleName}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="profile-field">
                                <p>Должность: </p>
                                <input
                                    type="text"
                                    name="position"
                                    value={profileInfo.position}
                                    onChange={handleChange}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <p>Имя: {profileInfo.firstName}</p>
                            <p>Фамилия: {profileInfo.lastName}</p>
                            <p>Отчество: {profileInfo.middleName}</p>
                            <p>Должность: {profileInfo.position}</p>
                        </>
                    )}
                    <button
                        onClick={
                            isEditingMain
                                ? handleSaveMainClick
                                : handleEditMainClick
                        }
                    >
                        {isEditingMain ? 'Сохранить' : 'Редактировать'}
                    </button>
                </div>
                <div className="profile-container-200px">
                    <h2>Контактная информация</h2>
                    {isEditingContact ? (
                        <>
                            <div className="profile-field">
                                <p>Адрес электронной почты: </p>
                                <input
                                    type="email"
                                    name="email"
                                    value={profileInfo.email}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="profile-field">
                                <p>Номер телефона: </p>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={profileInfo.phone}
                                    onChange={handleChange}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <p>Адрес электронной почты: {profileInfo.email}</p>
                            <p>Номер телефона: {profileInfo.phone}</p>
                        </>
                    )}
                    <button
                        onClick={
                            isEditingContact
                                ? handleSaveContactClick
                                : handleEditContactClick
                        }
                    >
                        {isEditingContact ? 'Сохранить' : 'Редактировать'}
                    </button>
                </div>
                <div className="profile-container-200px">
                    <h2>Дополнительная информация</h2>
                    {isEditingAdditional ? (
                        <div className="profile-field">
                            <p>О себе: </p>
                            <textarea
                                name="about"
                                value={profileInfo.about}
                                onChange={handleChange}
                            />
                        </div>
                    ) : (
                        <p>О себе: {profileInfo.about}</p>
                    )}
                    <button
                        onClick={
                            isEditingAdditional
                                ? handleSaveAdditionalClick
                                : handleEditAdditionalClick
                        }
                    >
                        {isEditingAdditional ? 'Сохранить' : 'Редактировать'}
                    </button>
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

export default ProfilePage;
