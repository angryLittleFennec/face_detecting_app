import React from 'react';
import { useRef, useState } from 'react';
import './ButtonWithTooltip.css';

const ButtonWithTooltip = ({
    className,
    iconSrc,
    altText,
    tooltipText,
    onClick,
}) => {
    const buttonRef = useRef(null);
    const [tooltipStyle, setTooltipStyle] = useState({
        visibility: 'hidden',
        opacity: 0,
        left: 0,
        top: 0,
    });

    const handleMouseEnter = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setTooltipStyle({
                visibility: 'visible',
                opacity: 1,
                left: `${rect.right}px`,
                top: `${rect.top + window.scrollY + rect.height / 2 - 10}px`, // Центрируем по вертикали
            });
        }
    };

    const handleMouseLeave = () => {
        setTooltipStyle({
            ...tooltipStyle,
            visibility: 'hidden',
            opacity: 0,
        });
    };

    return (
        <button
            ref={buttonRef}
            onClick={onClick}
            className={className}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <img src={iconSrc} alt={altText} />
            <div className="tooltip" style={{ ...tooltipStyle }}>
                {tooltipText}
            </div>
        </button>
    );
};

export default ButtonWithTooltip;
