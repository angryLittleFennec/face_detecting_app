const IconButton = ({ onClick, iconSrc, altText, className }) => {
    return (
        <button onClick={onClick} className={className}>
            <img src={iconSrc} alt={altText} />
        </button>
    );
};

export default IconButton;
