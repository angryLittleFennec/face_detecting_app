import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CameraSettingsWindow from './CameraSettingsWindow';

describe('CameraSettingsWindow Component', () => {
    let onClose;

    beforeEach(() => {
        onClose = jest.fn();
    });

    test('does not render when isOpen is false', () => {
        render(<CameraSettingsWindow isOpen={false} onClose={onClose} />);
        expect(screen.queryByText('Настройка камеры')).not.toBeInTheDocument();
    });

    test('renders correctly when isOpen is true', () => {
        render(<CameraSettingsWindow isOpen={true} onClose={onClose} />);

        expect(screen.getByText('Настройка камеры')).toBeInTheDocument();
        expect(
            screen.getByText('Здесь будут настройки камеры...')
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /закрыть/i })
        ).toBeInTheDocument();
    });

    test('calls onClose when close button is clicked', () => {
        render(<CameraSettingsWindow isOpen={true} onClose={onClose} />);

        const closeButton = screen.getByRole('button', { name: /закрыть/i });
        fireEvent.click(closeButton);

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
