// Хендлеры для редактирования персональной информации
import { useState } from 'react';

const ProfileHandlers = () => {
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

    return {
        profileInfo,
        isEditingMain,
        isEditingContact,
        isEditingAdditional,
        handleEditMainClick,
        handleEditContactClick,
        handleEditAdditionalClick,
        handleChange,
        handleSaveMainClick,
        handleSaveContactClick,
        handleSaveAdditionalClick,
    };
};

export default ProfileHandlers;
