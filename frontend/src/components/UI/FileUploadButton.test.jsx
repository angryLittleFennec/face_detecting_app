import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import FileUploadButton from './FileUploadButton';

describe('FileUploadButton', () => {
    let onClickMock;
    let onChangeMock;
    let fileRef;

    beforeEach(() => {
        onClickMock = jest.fn();
        onChangeMock = jest.fn();
        fileRef = React.createRef(); // Создаем реф для input
    });

    test('renders button correctly', () => {
        const { getByText } = render(
            <FileUploadButton
                onClick={onClickMock}
                onChange={onChangeMock}
                fileRef={fileRef}
            />
        );

        // Проверяем, что кнопка отображается с правильным текстом
        expect(getByText('Загрузить фотографии')).toBeInTheDocument();
    });

    test('calls onClick when button is clicked', () => {
        const { getByText } = render(
            <FileUploadButton
                onClick={onClickMock}
                onChange={onChangeMock}
                fileRef={fileRef}
            />
        );

        const button = getByText('Загрузить фотографии');
        fireEvent.click(button);

        // Проверяем, что функция onClick была вызвана
        expect(onClickMock).toHaveBeenCalledTimes(1);
    });

    test('calls onChange when a file is selected', () => {
        const { getByLabelText } = render(
            <FileUploadButton
                onClick={onClickMock}
                onChange={onChangeMock}
                fileRef={fileRef}
            />
        );

        // Создаем событие изменения для input
        const fileInput = fileRef.current; // Получаем доступ к рефу
        const file = new File(['dummy content'], 'example.jpeg', {
            type: 'image/jpeg',
        });

        // Симулируем изменение input
        fireEvent.change(fileInput, { target: { files: [file] } });

        // Проверяем, что функция onChange была вызвана
        expect(onChangeMock).toHaveBeenCalledTimes(1);
    });
});
