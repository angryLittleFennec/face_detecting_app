import { useState } from 'react';
import './Dropdown.css';

function Dropdown(props) {
    const { children } = props;
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
            {children.map((child) => (
                <option key={child.value} value={child.value}>
                    {child.label}
                </option>
            ))}
        </select>
    );
}

export default Dropdown;
