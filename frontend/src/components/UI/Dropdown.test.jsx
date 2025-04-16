import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Dropdown from './Dropdown';

describe('Dropdown component', () => {
    const options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
        { value: 'option3', label: 'Option 3' },
    ];

    test('renders dropdown with options', () => {
        render(<Dropdown>{options}</Dropdown>);

        // Проверяем, что элемент select существует
        const selectElement = screen.getByRole('combobox');
        expect(selectElement).toBeInTheDocument();

        // Проверяем, что все опции отображаются
        options.forEach((option) => {
            expect(screen.getByText(option.label)).toBeInTheDocument();
        });
    });

    test('initially selected value is "none"', () => {
        render(<Dropdown>{options}</Dropdown>);

        const selectElement = screen.getByRole('combobox');

        // Проверяем, что изначально выбранное значение равно "none"
        expect(selectElement.value).toBe('none');
    });

    test('selecting an option updates the selected value', () => {
        render(<Dropdown>{options}</Dropdown>);

        const selectElement = screen.getByRole('combobox');

        // Изменяем значение dropdown
        fireEvent.change(selectElement, { target: { value: 'option2' } });

        // Проверяем, что выбранное значение обновилось
        expect(selectElement.value).toBe('option2');
    });
});
