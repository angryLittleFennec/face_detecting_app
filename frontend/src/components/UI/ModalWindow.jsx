// Шаблон для создания модального окна (статус камер, логи на общей странице)
import './ModalWindow.css';

const ModalWindow = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            className="modal-overlay"
            onClick={onClose}
        >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
};

export default ModalWindow;
