import { useState } from 'react';

const SettingsHandlers = () => {
    const [password, setPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);

    const handleAdminAccess = () => {
        setIsAdmin(true); // Пока нет ролей
        // Логика получения доступа
        /*if (user.is_admin) {
            setIsAdmin(true);
        }*/
    };

    return { password, isAdmin, setPassword, handleAdminAccess };
};

export default SettingsHandlers;
