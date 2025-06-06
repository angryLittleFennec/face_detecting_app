// Хендлеры для редактирования персональной информации
import { useState } from 'react';
import { fetchCurrentUser } from '../Cameras/Api';

const ProfileHandlers = () => {
    const [isEditingContact, setIsEditingContact] = useState(false);
    const [isEditingAdditional, setIsEditingAdditional] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [about, setAbout] = useState('Пусто');

    const handleFetchCurrentUser = async () => {
        const data = await fetchCurrentUser();
        setUsername(data.username);
        setEmail(data.email);
        console.log(data);
    };

    const handleEditContactClick = () => {
        setIsEditingContact(true);
    };

    const handleEditAdditionalClick = () => {
        setIsEditingAdditional(true);
    };

    const handleChangeContact = (e) => {
        const { name, value } = e.target;
        setEmail(value);
    };

    const handleChangeAdditional = (e) => {
        const { name, value } = e.target;
        setAbout(value);
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
        username,
        email,
        isEditingContact,
        isEditingAdditional,
        about,
        setAbout,
        handleEditContactClick,
        handleEditAdditionalClick,
        handleChangeContact,
        handleChangeAdditional,
        handleSaveContactClick,
        handleSaveAdditionalClick,
        handleFetchCurrentUser,
    };
};

export default ProfileHandlers;
