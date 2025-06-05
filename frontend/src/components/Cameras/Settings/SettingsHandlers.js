import { useState } from 'react';
import { SETTINGS_PASSWORD } from '../../../config';

const SettingsHandlers = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [password, setPassword] = useState('');

    const handleAdminAccess = () => {
        // Пока нет ролей
        if (password === SETTINGS_PASSWORD) {
            setIsAdmin(true);
        }
        // Логика получения доступа
        /*if (user.is_admin) {
            setIsAdmin(true);
        }*/
    };

    return { isAdmin, password, setPassword, handleAdminAccess };
};

export default SettingsHandlers;
