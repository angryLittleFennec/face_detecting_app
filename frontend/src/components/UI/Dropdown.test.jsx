import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Dropdown from './Dropdown';

describe('Dropdown Component', () => {
    const mockOnChange = jest.fn(); // Создаем мок для функции onChange

    const options = [
        { name: 'Option 1', index: 1 },
        { name: 'Option 2', index: 2 },
        { name: 'Option 3', index: 3 },
    ];

    beforeEach(() => {
        jest.clearAllMocks(); // Сброс мока перед каждым тестом
    });

    test('renders dropdown with correct initial text', () => {
        render(
            <Dropdown
                selectedValue=""
                onChange={mockOnChange}
                text="Select an option"
                children={options}
            />
        );

        const dropdown = screen.getByRole('combobox'); // Находим элемент select
        expect(dropdown).toBeInTheDocument(); // Проверяем, что элемент существует
        expect(dropdown).toHaveValue(''); // Проверяем, что значение по умолчанию пустое
        expect(dropdown).toHaveTextContent('Select an option'); // Проверяем текст по умолчанию
    });

    test('renders dropdown with options', () => {
        render(
            <Dropdown
                selectedValue=""
                onChange={mockOnChange}
                text="Select an option"
                children={options}
            />
        );

        const dropdown = screen.getByRole('combobox');
        expect(dropdown).toHaveValue('');
        fireEvent.change(dropdown, { target: { value: options[0].name } }); // Изменяем значение

        expect(mockOnChange).toHaveBeenCalledTimes(1); // Проверяем, что onChange был вызван
        expect(dropdown).toHaveValue('Option 1'); // Проверяем, что значение изменилось на Option 1
    });

    test('renders all options correctly', () => {
        render(
            <Dropdown
                selectedValue=""
                onChange={mockOnChange}
                text="Select an option"
                children={options}
            />
        );

        const dropdown = screen.getByRole('combobox');

        // Проверяем наличие всех опций
        const optionElements = screen.getAllByRole('option');
        expect(optionElements.length).toBe(options.length + 1); // +1 для опции по умолчанию

        // Проверяем текст каждой опции
        options.forEach((option) => {
            expect(screen.getByText(option.name)).toBeInTheDocument();
        });
    });

    test('disables the default option', () => {
        render(
            <Dropdown
                selectedValue=""
                onChange={mockOnChange}
                text="Select an option"
                children={options}
            />
        );

        const defaultOption = screen.getByRole('option', {
            name: 'Select an option',
        });
        expect(defaultOption).toBeDisabled(); // Проверяем, что опция по умолчанию отключена
    });
});
