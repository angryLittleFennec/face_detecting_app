import React from 'react';
import SettingsHandlers from './SettingsHandlers';
import { render, screen, fireEvent } from '@testing-library/react';
import { SETTINGS_PASSWORD } from '../../../config';

const TestComponent = () => {
    const { isAdmin, password, setPassword, handleAdminAccess } =
        SettingsHandlers();

    return (
        <div>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
            />
            <button onClick={handleAdminAccess}>Access Admin</button>
            {isAdmin && <p>Access Granted</p>}
            {!isAdmin && password && <p>Access Denied</p>}
        </div>
    );
};

// Мокаем SETTINGS_PASSWORD
jest.mock('../../../config', () => ({
    SETTINGS_PASSWORD: 'correct-password',
}));

describe('TestComponent', () => {
    it('should grant access when the correct password is entered', () => {
        render(<TestComponent />);

        // Вводим правильный пароль
        fireEvent.change(screen.getByPlaceholderText('Enter password'), {
            target: { value: 'correct-password' },
        });
        fireEvent.click(screen.getByText('Access Admin'));

        expect(screen.getByText('Access Granted')).toBeInTheDocument();
        expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    });

    it('should deny access when the incorrect password is entered', () => {
        render(<TestComponent />);

        // Вводим неправильный пароль
        fireEvent.change(screen.getByPlaceholderText('Enter password'), {
            target: { value: 'wrong-password' },
        });
        fireEvent.click(screen.getByText('Access Admin'));

        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.queryByText('Access Granted')).not.toBeInTheDocument();
    });

    it('should not show any message when no password is entered', () => {
        render(<TestComponent />);

        fireEvent.click(screen.getByText('Access Admin'));

        expect(screen.queryByText('Access Granted')).not.toBeInTheDocument();
        expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    });
});
