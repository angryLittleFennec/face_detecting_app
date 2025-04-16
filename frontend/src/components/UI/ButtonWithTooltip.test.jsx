import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ButtonWithTooltip from './ButtonWithTooltip';

describe('ButtonWithTooltip', () => {
    const mockOnClick = jest.fn();

    beforeEach(() => {
        render(
            <ButtonWithTooltip
                iconSrc="icon.png"
                altText="Icon"
                tooltipText="Tooltip text"
                onClick={mockOnClick}
            />
        );
    });

    test('renders button with icon and tooltip', () => {
        const button = screen.getByRole('button');
        const icon = screen.getByAltText('Icon');

        expect(button).toBeInTheDocument();
        expect(icon).toBeInTheDocument();
        expect(screen.queryByText('Tooltip text')).not.toBeVisible(); // Tooltip не должен быть видим изначально
    });

    test('shows tooltip on mouse enter', () => {
        const button = screen.getByRole('button');

        fireEvent.mouseEnter(button);

        const tooltip = screen.getByText('Tooltip text');
        expect(tooltip).toBeVisible(); // Tooltip должен стать видимым
        expect(tooltip).toHaveStyle('visibility: visible'); // Проверяем стиль
        expect(tooltip).toHaveStyle('opacity: 1'); // Проверяем стиль
    });

    test('hides tooltip on mouse leave', () => {
        const button = screen.getByRole('button');

        fireEvent.mouseEnter(button);
        fireEvent.mouseLeave(button);

        const tooltip = screen.getByText('Tooltip text');
        expect(tooltip).not.toBeVisible(); // Tooltip должен стать невидимым
        expect(tooltip).toHaveStyle('visibility: hidden'); // Проверяем стиль
        expect(tooltip).toHaveStyle('opacity: 0'); // Проверяем стиль
    });

    test('calls onClick when button is clicked', () => {
        const button = screen.getByRole('button');

        fireEvent.click(button);

        expect(mockOnClick).toHaveBeenCalledTimes(1); // Проверяем, что функция была вызвана один раз
    });
});
