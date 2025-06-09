import { render, screen, fireEvent } from '@testing-library/react';
import StaffPage from './StaffPage';
import * as DataHandlers from './DataHandlers';
import NavigationHandlers from '../GeneralComponents/NavigationHandlers';

jest.mock('./DataHandlers');
jest.mock('../GeneralComponents/NavigationHandlers');

describe('StaffPage Component', () => {
    let mockGoToCamerasHandler;
    let mockLogoutHandler;
    let mockFetchPersons;
    let mockHandleDeletePerson;
    let mockOpenUploadWindow;
    let mockCloseUploadWindow;
    let mockOpenEditWindow;
    let mockCloseEditWindow;
    let mockHandlePersonClick;

    beforeEach(() => {
        mockGoToCamerasHandler = jest.fn();
        mockLogoutHandler = jest.fn();
        mockFetchPersons = jest.fn();
        mockHandleDeletePerson = jest.fn();
        mockOpenUploadWindow = jest.fn();
        mockCloseUploadWindow = jest.fn();
        mockOpenEditWindow = jest.fn();
        mockCloseEditWindow = jest.fn();
        mockHandlePersonClick = jest.fn();

        NavigationHandlers.mockReturnValue({
            goToCamerasHandler: mockGoToCamerasHandler,
            logoutHandler: mockLogoutHandler,
        });

        DataHandlers.__setMockFetchPersons(mockFetchPersons);
        DataHandlers.__setMockHandleDeletePerson(mockHandleDeletePerson);
        DataHandlers.__setMockOpenUploadWindow(mockOpenUploadWindow);
        DataHandlers.__setMockCloseUploadWindow(mockCloseUploadWindow);
        DataHandlers.__setMockOpenEditWindow(mockOpenEditWindow);
        DataHandlers.__setMockCloseEditWindow(mockCloseEditWindow);
        DataHandlers.__setMockHandlePersonClick(mockHandlePersonClick);
    });

    // afterEach(() => {
    //     jest.clearAllMocks();
    // });

    test('renders loading state', async () => {
        DataHandlers.__setLoading(true); // Устанавливаем состояние загрузки

        const { getByText } = render(<StaffPage />);

        expect(getByText('Загрузка...')).toBeInTheDocument();

        await waitFor(() => {
            expect(mockFetchPersons).toHaveBeenCalled(); // Проверяем, что функция получения сотрудников была вызвана
        });
    });

    test('renders list of employees', async () => {
        const mockPersons = [
            { id: 1, name: 'John Doe', faces: [] },
            { id: 2, name: 'Jane Smith', faces: [] },
        ];

        DataHandlers.__setPersons(mockPersons); // Устанавливаем список сотрудников
        DataHandlers.__setLoading(false); // Устанавливаем состояние загрузки в false

        const { getByText } = render(<StaffPage />);

        await waitFor(() => {
            expect(getByText('Список сотрудников')).toBeInTheDocument();
            expect(getByText('John Doe')).toBeInTheDocument();
            expect(getByText('Jane Smith')).toBeInTheDocument();
        });
    });

    test('handles delete button click', async () => {
        const mockPersons = [{ id: 1, name: 'John Doe', faces: [] }];

        DataHandlers.__setPersons(mockPersons);
        DataHandlers.__setLoading(false);

        window.confirm = jest.fn(() => true); // Мокаем confirm для имитации подтверждения удаления

        const { getByText } = render(<StaffPage />);

        await waitFor(() => {
            expect(getByText('John Doe')).toBeInTheDocument();
        });

        fireEvent.click(getByText('Удалить')); // Нажимаем кнопку "Удалить"

        expect(window.confirm).toHaveBeenCalledWith('удалить?'); // Проверяем, что confirm был вызван
        expect(mockHandleDeletePerson).toHaveBeenCalledWith(1); // Проверяем, что функция удаления была вызвана с правильным ID
    });

    test('navigates to cameras on button click', () => {
        const { getByAltText } = render(<StaffPage />);

        fireEvent.click(getByAltText('Назад')); // Нажимаем кнопку "Назад"

        expect(mockGoToCamerasHandler).toHaveBeenCalled(); // Проверяем, что обработчик навигации был вызван
    });

    test('logs out on button click', () => {
        const { getByAltText } = render(<StaffPage />);

        fireEvent.click(getByAltText('Выход')); // Нажимаем кнопку "Выход"

        expect(mockLogoutHandler).toHaveBeenCalled(); // Проверяем, что обработчик выхода был вызван
    });
});
