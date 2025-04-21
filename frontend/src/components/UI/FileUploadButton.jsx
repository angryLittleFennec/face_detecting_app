import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { addFiles } from '../../actions';

const FileUploadButton = () => {
    const dispatch = useDispatch();
    const fileInputRef = useRef(null);
    const [fileName, setFileName] = useState('');

    const handleButtonClick = () => {
        fileInputRef.current.click(); // Программно вызываем клик на input
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        setFileName(selectedFile ? selectedFile.name : 'Нет файла');
        const uploadedFiles = Array.from(event.target.files);
        dispatch(addFiles(uploadedFiles));
    };

    return (
        <div>
            <div>Загруженный файл: {fileName}</div>
            <br />
            <button onClick={handleButtonClick}>Выбрать файл</button>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                multiple
                onChange={handleFileChange}
            />
        </div>
    );
};

export default FileUploadButton;
