import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StaffEditWindow from './StaffEditWindow';
import * as DataHandlers from './DataHandlers';

// Мокаем необходимые зависимости
jest.mock('./DataHandlers');

describe('StaffEditWindow', () => {
    const mockOnClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('не отображает ничего, если isOpen равно false', () => {
        render(<StaffEditWindow isOpen={false} onClose={mockOnClose} />);
        expect(
            screen.queryByText(/Изменить сотрудника/i)
        ).not.toBeInTheDocument();
    });

    test('отображает "Загрузка..." при загрузке данных', () => {
        DataHandlers.default.mockReturnValue({
            loading: true,
            handleFetchPersons: jest.fn(),
        });

        render(<StaffEditWindow isOpen={true} onClose={mockOnClose} />);

        expect(screen.getByText(/Загрузка.../i)).toBeInTheDocument();
    });

    test('отображает ошибку при наличии ошибки', () => {
        DataHandlers.default.mockReturnValue({
            loading: false,
            error: 'Ошибка загрузки',
        });

        render(<StaffEditWindow isOpen={true} onClose={mockOnClose} />);

        expect(
            screen.getByText(/Ошибка: Ошибка загрузки/i)
        ).toBeInTheDocument();
    });

    test('отображает элементы модального окна', () => {
        DataHandlers.default.mockReturnValue({
            loading: false,
            persons: [],
            newPerson: { name: '' },
            newFace: [],
            selectedPerson: '',
            selectedPersonId: null,
            handleStaffSelectChange: jest.fn(),
            setNewPerson: jest.fn(),
            handleUpdatePerson: jest.fn(),
            handleFetchPersons: jest.fn(),
            handleFileChange: jest.fn(),
            handleButtonClick: jest.fn(),
            handleAddFace: jest.fn(),
        });

        render(<StaffEditWindow isOpen={true} onClose={mockOnClose} />);

        expect(screen.getByText(/Изменить сотрудника/i)).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText(/Фамилия Имя Отчество/i)
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Изменить/i })
        ).toBeInTheDocument();
        expect(screen.getByText(/Фотографии сотрудника/i)).toBeInTheDocument();
        expect(screen.getByText(/Фотографии отсутствуют/i)).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Закрыть/i })
        ).toBeInTheDocument();
    });

    test('вызывает onClose при нажатии кнопки "Закрыть"', () => {
        DataHandlers.default.mockReturnValue({
            loading: false,
            persons: [],
            newPerson: { name: '' },
            newFace: [],
            selectedPerson: '',
            selectedPersonId: null,
            handleStaffSelectChange: jest.fn(),
            setNewPerson: jest.fn(),
            handleUpdatePerson: jest.fn(),
            handleFetchPersons: jest.fn(),
            handleFileChange: jest.fn(),
            handleButtonClick: jest.fn(),
            handleAddFace: jest.fn(),
        });

        render(<StaffEditWindow isOpen={true} onClose={mockOnClose} />);

        fireEvent.click(screen.getByRole('button', { name: /Закрыть/i }));
        expect(mockOnClose).toHaveBeenCalled();
    });

    test('вызывает функции при изменении имени сотрудника', () => {
        const setNewPerson = jest.fn();

        DataHandlers.default.mockReturnValue({
            loading: false,
            persons: [],
            newPerson: { name: '' },
            newFace: [],
            selectedPerson: '',
            selectedPersonId: null,
            handleStaffSelectChange: jest.fn(),
            setNewPerson,
            handleUpdatePerson: jest.fn(),
            handleFetchPersons: jest.fn(),
            handleFileChange: jest.fn(),
            handleButtonClick: jest.fn(),
            handleAddFace: jest.fn(),
        });

        render(<StaffEditWindow isOpen={true} onClose={mockOnClose} />);

        const input = screen.getByPlaceholderText(/Фамилия Имя Отчество/i);
        fireEvent.change(input, { target: { value: 'Иванов Иван Иванович' } });

        expect(setNewPerson).toHaveBeenCalledWith({
            name: 'Иванов Иван Иванович',
        });
    });

    test('вызывает handleUpdatePerson при нажатии кнопки "Изменить"', () => {
        const handleUpdatePerson = jest.fn();

        DataHandlers.default.mockReturnValue({
            loading: false,
            persons: [],
            newPerson: { name: '' },
            newFace: [],
            selectedPersonId: '123',
            selectedPerson: '',
            handleStaffSelectChange: jest.fn(),
            setNewPerson: jest.fn(),
            handleUpdatePerson,
            handleFetchPersons: jest.fn(),
            handleFileChange: jest.fn(),
            handleButtonClick: jest.fn(),
            handleAddFace: jest.fn(),
        });

        render(<StaffEditWindow isOpen={true} onClose={mockOnClose} />);

        fireEvent.click(screen.getByRole('button', { name: /Изменить/i }));

        expect(handleUpdatePerson).toHaveBeenCalledWith('123');
    });

    test('отображает количество добавленных фотографий', () => {
        DataHandlers.default.mockReturnValue({
            loading: false,
            persons: [],
            newPerson: { name: '' },
            newFace: ['photo1.jpg', 'photo2.jpg'],
            selectedPersonId: null,
            selectedPerson: '',
            handleStaffSelectChange: jest.fn(),
            setNewPerson: jest.fn(),
            handleUpdatePerson: jest.fn(),
            handleFetchPersons: jest.fn(),
            handleFileChange: jest.fn(),
            handleButtonClick: jest.fn(),
            handleAddFace: jest.fn(),
        });

        render(<StaffEditWindow isOpen={true} onClose={mockOnClose} />);

        expect(screen.getByText(/Добавлено 2 фотографий/i)).toBeInTheDocument();
    });
});
