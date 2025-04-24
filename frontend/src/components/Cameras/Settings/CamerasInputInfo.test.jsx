import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CamerasInputInfo from './CamerasInputInfo';

describe('CamerasInputInfo Component', () => {
    let newCamera;
    let setNewCamera;

    beforeEach(() => {
        newCamera = {
            name: '',
            url: '',
            description: '',
            is_active: false,
        };
        setNewCamera = jest.fn();
    });

    test('renders input fields and checkbox', () => {
        render(
            <CamerasInputInfo
                newCamera={newCamera}
                setNewCamera={setNewCamera}
            />
        );

        expect(
            screen.getByPlaceholderText('Название камеры')
        ).toBeInTheDocument();
        expect(screen.getByPlaceholderText('URL видео')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Описание')).toBeInTheDocument();
        expect(screen.getByLabelText('Активна:')).toBeInTheDocument();
    });

    test('updates camera name on input change', () => {
        render(
            <CamerasInputInfo
                newCamera={newCamera}
                setNewCamera={setNewCamera}
            />
        );

        const nameInput = screen.getByPlaceholderText('Название камеры');
        fireEvent.change(nameInput, { target: { value: 'Camera 1' } });

        expect(setNewCamera).toHaveBeenCalledWith({
            ...newCamera,
            name: 'Camera 1',
        });
    });

    test('updates camera URL on input change', () => {
        render(
            <CamerasInputInfo
                newCamera={newCamera}
                setNewCamera={setNewCamera}
            />
        );

        const urlInput = screen.getByPlaceholderText('URL видео');
        fireEvent.change(urlInput, { target: { value: 'http://example.com' } });

        expect(setNewCamera).toHaveBeenCalledWith({
            ...newCamera,
            url: 'http://example.com',
        });
    });

    test('updates camera description on input change', () => {
        render(
            <CamerasInputInfo
                newCamera={newCamera}
                setNewCamera={setNewCamera}
            />
        );

        const descriptionInput = screen.getByPlaceholderText('Описание');
        fireEvent.change(descriptionInput, {
            target: { value: 'Description of camera' },
        });

        expect(setNewCamera).toHaveBeenCalledWith({
            ...newCamera,
            description: 'Description of camera',
        });
    });

    test('updates is_active state on checkbox change', () => {
        render(
            <CamerasInputInfo
                newCamera={newCamera}
                setNewCamera={setNewCamera}
            />
        );

        const checkbox = screen.getByLabelText('Активна:');
        fireEvent.click(checkbox);

        expect(setNewCamera).toHaveBeenCalledWith({
            ...newCamera,
            is_active: true,
        });
    });
});
