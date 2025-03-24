import { useState } from 'react';
import './Dropdown.css';

function Dropdown(props) {
    const { children, text } = props;
    const [selectedValue, setSelectedValue] = useState('none');

    const handleDropdownChange = (event) => {
        setSelectedValue(event.target.value);
        console.log(event.target.value);
    };

    return (
        <select
            className="dropdown"
            id="dropdownButton"
            value={selectedValue}
            onChange={handleDropdownChange}
        >
            <option value="none" disabled>
                {text}
            </option>
            {children.map((child) => (
                <option key={child.value} value={child.value}>
                    {child.label}
                </option>
            ))}
        </select>
    );
}

export default Dropdown;
