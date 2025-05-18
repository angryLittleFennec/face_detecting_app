const FileUploadButton = ({ onClick, onChange, fileRef }) => {
    return (
        <div>
            <button onClick={onClick}>Добавить фотографии</button>
            <input
                type="file"
                ref={fileRef}
                style={{ display: 'none' }}
                multiple
                accept="image/jpeg"
                onChange={onChange}
            />
        </div>
    );
};

export default FileUploadButton;
