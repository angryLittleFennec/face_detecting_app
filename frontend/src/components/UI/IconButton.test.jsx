import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import IconButton from './IconButton';

describe('IconButton Component', () => {
    test('renders the button with the correct icon and alt text', () => {
        const iconSrc = 'path/to/icon.png';
        const altText = 'Test Icon';

        render(
            <IconButton
                onClick={jest.fn()}
                iconSrc={iconSrc}
                altText={altText}
            />
        );

        const button = screen.getByRole('button');
        const img = screen.getByAltText(altText);

        expect(button).toBeInTheDocument();
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', iconSrc);
    });

    test('calls onClick handler when clicked', () => {
        const handleClick = jest.fn();
        const iconSrc = 'path/to/icon.png';
        const altText = 'Test Icon';

        render(
            <IconButton
                onClick={handleClick}
                iconSrc={iconSrc}
                altText={altText}
            />
        );

        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('applies the provided className', () => {
        const iconSrc = 'path/to/icon.png';
        const altText = 'Test Icon';
        const className = 'custom-class';

        render(
            <IconButton
                onClick={jest.fn()}
                iconSrc={iconSrc}
                altText={altText}
                className={className}
            />
        );

        const button = screen.getByRole('button');
        expect(button).toHaveClass(className);
    });
});
