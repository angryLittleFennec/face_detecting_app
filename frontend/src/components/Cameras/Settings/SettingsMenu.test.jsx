import { render, screen, fireEvent } from '@testing-library/react';
import SettingsMenu from './SettingsMenu';
import { Router } from 'react-router';

describe('SettingsMenu Component', () => {
    test('renders notification selector with default options', () => {
        render(
            <Router>
                <SettingsMenu />
            </Router>
        );

        // Проверяем наличие элементов
        expect(screen.getByLabelText(/Камеры/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Видеопотоки/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Детекция/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Распознавание лиц/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Дополнительно/i)).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toHaveValue('');
    });
});
