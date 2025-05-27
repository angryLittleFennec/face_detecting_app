// Выпадающий список
import './Dropdown.css';

function Dropdown(props) {
    const { children, selectedValue, onChange, text } = props;

    return (
        <select className="dropdown" value={selectedValue} onChange={onChange}>
            <option value="" disabled>
                {text}
            </option>
            {children.map((child) => (
                <option key={child.index} value={child.name}>
                    {child.name}
                </option>
            ))}
        </select>
    );
}

export default Dropdown;
