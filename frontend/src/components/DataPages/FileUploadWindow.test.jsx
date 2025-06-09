import { render, screen, fireEvent } from '@testing-library/react';
import FileUploadWindow from './FileUploadWindow';
import DataHandlers from './DataHandlers';

// Мокируем DataHandlers
jest.mock('./DataHandlers', () => {
    return jest.fn(() => ({
        newPerson: { name: '' },
        newFace: [],
        fileInputRef: { current: null },
        setNewPerson: jest.fn(),
        handleCreatePerson: jest.fn(),
        handleFileChange: jest.fn(),
        handleButtonClick: jest.fn(),
    }));
});

describe('FileUploadWindow', () => {
    const onCloseMock = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should not render when isOpen is false', () => {
        render(<FileUploadWindow isOpen={false} onClose={onCloseMock} />);
        expect(
            screen.queryByText(/Добавление сотрудников/i)
        ).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
        render(<FileUploadWindow isOpen={true} onClose={onCloseMock} />);
        expect(screen.getByText(/Добавление сотрудников/i)).toBeInTheDocument();
    });

    it('should display "Фотографии отсутствуют" when no photos are added', () => {
        DataHandlers.mockReturnValueOnce({
            newPerson: { name: '' },
            newFace: [],
            fileInputRef: { current: null },
            setNewPerson: jest.fn(),
            handleCreatePerson: jest.fn(),
            handleFileChange: jest.fn(),
            handleButtonClick: jest.fn(),
        });

        render(<FileUploadWindow isOpen={true} onClose={onCloseMock} />);
        expect(screen.getByText(/Фотографии отсутствуют/i)).toBeInTheDocument();
    });

    it('should display the number of added photos', () => {
        DataHandlers.mockReturnValueOnce({
            newPerson: { name: '' },
            newFace: ['photo1.jpg', 'photo2.jpg'],
            fileInputRef: { current: null },
            setNewPerson: jest.fn(),
            handleCreatePerson: jest.fn(),
            handleFileChange: jest.fn(),
            handleButtonClick: jest.fn(),
        });

        render(<FileUploadWindow isOpen={true} onClose={onCloseMock} />);
        expect(screen.getByText(/Добавлено 2 фотографий/i)).toBeInTheDocument();
    });

    it('should call setNewPerson when input value changes', () => {
        const mockSetNewPerson = jest.fn();
        DataHandlers.mockReturnValueOnce({
            newPerson: { name: '' },
            newFace: [],
            fileInputRef: { current: null },
            setNewPerson: mockSetNewPerson,
            handleCreatePerson: jest.fn(),
            handleFileChange: jest.fn(),
            handleButtonClick: jest.fn(),
        });

        render(<FileUploadWindow isOpen={true} onClose={onCloseMock} />);

        const input = screen.getByPlaceholderText(/Фамилия Имя Отчество/i);
        fireEvent.change(input, { target: { value: 'Иванов Иван Иванович' } });

        expect(mockSetNewPerson).toHaveBeenCalledWith({
            name: 'Иванов Иван Иванович',
        });
    });

    it('should call handleCreatePerson when "Добавить" button is clicked', () => {
        const mockHandleCreatePerson = jest.fn();
        DataHandlers.mockReturnValueOnce({
            newPerson: { name: 'Иванов Иван Иванович' },
            newFace: [],
            fileInputRef: { current: null },
            setNewPerson: jest.fn(),
            handleCreatePerson: mockHandleCreatePerson,
            handleFileChange: jest.fn(),
            handleButtonClick: jest.fn(),
        });

        render(<FileUploadWindow isOpen={true} onClose={onCloseMock} />);

        fireEvent.click(screen.getByText(/Добавить/i));

        expect(mockHandleCreatePerson).toHaveBeenCalled();
    });

    it('should call onClose when "Закрыть" button is clicked', () => {
        render(<FileUploadWindow isOpen={true} onClose={onCloseMock} />);

        fireEvent.click(screen.getByText(/Закрыть/i));

        expect(onCloseMock).toHaveBeenCalled();
    });
});
