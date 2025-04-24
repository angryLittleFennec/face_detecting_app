import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ModalWindow from './ModalWindow';

describe('ModalWindow Component', () => {
    test('does not render when isOpen is false', () => {
        render(
            <ModalWindow isOpen={false} onClose={jest.fn()}>
                Test Content
            </ModalWindow>
        );
        expect(screen.queryByText(/test content/i)).not.toBeInTheDocument();
    });

    test('renders when isOpen is true', () => {
        render(
            <ModalWindow isOpen={true} onClose={jest.fn()}>
                Test Content
            </ModalWindow>
        );
        expect(screen.getByText(/test content/i)).toBeInTheDocument();
    });

    test('calls onClose when overlay is clicked', () => {
        const handleClose = jest.fn();
        render(
            <ModalWindow isOpen={true} onClose={handleClose}>
                Test Content
            </ModalWindow>
        );

        // Клик на оверлей
        fireEvent.click(screen.getByRole('dialog'));
        expect(handleClose).toHaveBeenCalledTimes(1);
    });

    test('does not call onClose when modal content is clicked', () => {
        const handleClose = jest.fn();
        render(
            <ModalWindow isOpen={true} onClose={handleClose}>
                Test Content
            </ModalWindow>
        );

        // Клик на содержимое модального окна
        fireEvent.click(screen.getByText(/test content/i));
        expect(handleClose).toHaveBeenCalledTimes(0);
    });
});
