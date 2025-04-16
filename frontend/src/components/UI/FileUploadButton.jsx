import { useRef, useState } from 'react';

const FileUploadButton = () => {
    const fileInputRef = useRef(null);
    const [fileName, setFileName] = useState('');

    const handleButtonClick = () => {
        fileInputRef.current.click(); // Программно вызываем клик на input
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        setFileName(selectedFile ? selectedFile.name : 'Нет файла');
    };

    return (
        <div>
            <div>Выбранный файл: {fileName}</div>
            <br />
            <button onClick={handleButtonClick}>Выбрать файл</button>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
        </div>
    );
};

export default FileUploadButton;
