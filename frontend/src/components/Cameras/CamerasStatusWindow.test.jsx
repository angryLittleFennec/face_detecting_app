import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CamerasStatusWindow from './CamerasStatusWindow';

describe('CamerasStatusWindow Component', () => {
    const onCloseMock = jest.fn();

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('does not render when isOpen is false', () => {
        render(
            <CamerasStatusWindow
                isOpen={false}
                onClose={onCloseMock}
                cameras={[]}
            />
        );
        expect(screen.queryByText('Статус камер')).not.toBeInTheDocument();
    });

    test('renders correctly when isOpen is true and cameras are provided', () => {
        const cameras = [
            { name: 'Камера 1', is_active: true },
            { name: 'Камера 2', is_active: false },
        ];

        render(
            <CamerasStatusWindow
                isOpen={true}
                onClose={onCloseMock}
                cameras={cameras}
            />
        );

        expect(screen.getByText('Статус камер')).toBeInTheDocument();
        expect(screen.getByText('Камера 1: Активна')).toBeInTheDocument();
        expect(screen.getByText('Камера 2: Отключена')).toBeInTheDocument();
    });

    test('renders message when no cameras are found', () => {
        render(
            <CamerasStatusWindow
                isOpen={true}
                onClose={onCloseMock}
                cameras={[]}
            />
        );

        expect(screen.getByText('Статус камер')).toBeInTheDocument();
        expect(screen.getByText('Камеры не найдены')).toBeInTheDocument();
    });

    test('calls onClose when close button is clicked', () => {
        const cameras = [{ name: 'Камера 1', is_active: true }];

        render(
            <CamerasStatusWindow
                isOpen={true}
                onClose={onCloseMock}
                cameras={cameras}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /закрыть/i }));
        expect(onCloseMock).toHaveBeenCalledTimes(1);
    });
});
