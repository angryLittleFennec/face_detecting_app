import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationSelector from './NotificationSelector'; // Убедитесь, что путь к вашему файлу правильный

describe('NotificationSelector Component', () => {
    test('renders notification selector with default options', () => {
        render(<NotificationSelector />);

        // Проверяем наличие элементов
        expect(
            screen.getByLabelText(/выберите способ отправки уведомлений/i)
        ).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toHaveValue('');
    });

    test('changes selected option to email and displays input field', () => {
        render(<NotificationSelector />);

        // Выбираем опцию "Письмом на email"
        fireEvent.change(screen.getByRole('combobox'), {
            target: { value: 'email' },
        });

        // Проверяем, что выбранная опция изменилась
        expect(screen.getByRole('combobox')).toHaveValue('email');
        expect(
            screen.getByLabelText(/введите почтовый адрес:/i)
        ).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText(/example@email.com/i)
        ).toBeInTheDocument();
    });

    test('changes selected option to telegram and displays input field', () => {
        render(<NotificationSelector />);

        // Выбираем опцию "Телеграм ботом"
        fireEvent.change(screen.getByRole('combobox'), {
            target: { value: 'telegram' },
        });

        // Проверяем, что выбранная опция изменилась
        expect(screen.getByRole('combobox')).toHaveValue('telegram');
        expect(
            screen.getByLabelText(/введите ник телеграм:/i)
        ).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText(/@example_nickname/i)
        ).toBeInTheDocument();
    });

    test('clears input field when option changes', () => {
        render(<NotificationSelector />);

        // Сначала выбираем "Письмом на email" и вводим значение
        fireEvent.change(screen.getByRole('combobox'), {
            target: { value: 'email' },
        });
        fireEvent.change(screen.getByPlaceholderText(/example@email.com/i), {
            target: { value: 'test@example.com' },
        });

        // Проверяем, что значение введено
        expect(screen.getByPlaceholderText(/example@email.com/i)).toHaveValue(
            'test@example.com'
        );

        // Меняем опцию на "Телеграм ботом"
        fireEvent.change(screen.getByRole('combobox'), {
            target: { value: 'telegram' },
        });

        // Проверяем, что поле ввода очищено
        expect(screen.getByPlaceholderText(/@example_nickname/i)).toHaveValue(
            ''
        );
    });
});
