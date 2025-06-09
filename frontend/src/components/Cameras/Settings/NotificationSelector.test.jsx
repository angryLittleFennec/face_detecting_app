import { render, screen, fireEvent } from '@testing-library/react';
import NotificationSelector from './NotificationSelector';
import * as ProfileHandlers from '../../Profile/ProfileHandlers';
import * as CamerasHandlers from '../CamerasHandlers';

jest.mock('../../Profile/ProfileHandlers');
jest.mock('../CamerasHandlers');

describe('NotificationSelector Component', () => {
    beforeEach(() => {
        ProfileHandlers.default.mockReturnValue({
            email: '',
            handleFetchCurrentUser: jest.fn(),
            handleChangeContact: jest.fn(),
        });

        CamerasHandlers.default.mockReturnValue({
            loading: false,
            error: null,
            setLoading: jest.fn(),
        });

        render(<NotificationSelector />);
    });

    test('renders notification selector with default options', () => {
        // Проверяем наличие элементов
        expect(
            screen.getByLabelText(/выберите способ отправки уведомлений/i)
        ).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toHaveValue('');
    });

    test('changes selected option to email and displays input field', () => {
        // Выбираем опцию "Письмом на email"
        fireEvent.change(screen.getByRole('combobox'), {
            target: { value: 'email' },
        });

        // Проверяем, что выбранная опция изменилась
        expect(screen.getByRole('combobox')).toHaveValue('email');
        expect(
            screen.getByLabelText(/Адрес для отправки уведомлений:/i)
        ).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText(/example@email.com/i)
        ).toBeInTheDocument();
    });
});
