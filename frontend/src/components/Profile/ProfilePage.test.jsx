import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfilePage from './ProfilePage';
import * as ProfileHandlers from './ProfileHandlers';
import * as CamerasHandlers from '../Cameras/CamerasHandlers';
import * as NavigationHandlers from '../GeneralComponents/NavigationHandlers';

jest.mock('./ProfileHandlers');
jest.mock('../Cameras/CamerasHandlers');
jest.mock('../GeneralComponents/NavigationHandlers');

describe('ProfilePage', () => {
    beforeEach(() => {
        NavigationHandlers.default.mockReturnValue({
            goToCamerasHandler: jest.fn(),
            logoutHandler: jest.fn(),
        });

        CamerasHandlers.default.mockReturnValue({
            loading: false,
            error: null,
            setLoading: jest.fn(),
        });
    });

    test('renders loading state', () => {
        CamerasHandlers.default.mockReturnValue({
            loading: true,
            error: null,
            setLoading: jest.fn(),
        });
        ProfileHandlers.default.mockReturnValue({
            username: '',
            email: '',
            isEditingContact: false,
            isEditingAdditional: false,
            about: '',
            handleEditContactClick: jest.fn(),
            handleEditAdditionalClick: jest.fn(),
            handleChangeContact: jest.fn(),
            handleChangeAdditional: jest.fn(),
            handleSaveContactClick: jest.fn(),
            handleSaveAdditionalClick: jest.fn(),
            handleFetchCurrentUser: jest.fn(),
        });

        render(<ProfilePage />);

        expect(screen.getByText(/Загрузка.../)).toBeInTheDocument();
    });

    test('renders error state', () => {
        CamerasHandlers.default.mockReturnValue({
            loading: false,
            error: 'Ошибка загрузки',
            setLoading: jest.fn(),
        });
        ProfileHandlers.default.mockReturnValue({
            username: '',
            email: '',
            isEditingContact: false,
            isEditingAdditional: false,
            about: '',
            handleEditContactClick: jest.fn(),
            handleEditAdditionalClick: jest.fn(),
            handleChangeContact: jest.fn(),
            handleChangeAdditional: jest.fn(),
            handleSaveContactClick: jest.fn(),
            handleSaveAdditionalClick: jest.fn(),
            handleFetchCurrentUser: jest.fn(),
        });

        render(<ProfilePage />);

        expect(screen.getByText(/Ошибка: Ошибка загрузки/)).toBeInTheDocument();
    });

    test('renders profile information', () => {
        CamerasHandlers.default.mockReturnValue({
            loading: false,
            error: null,
            setLoading: jest.fn(),
        });
        ProfileHandlers.default.mockReturnValue({
            username: 'testuser',
            email: 'test@example.com',
            isEditingContact: false,
            isEditingAdditional: false,
            about: 'Информация о пользователе',
            handleEditContactClick: jest.fn(),
            handleEditAdditionalClick: jest.fn(),
            handleChangeContact: jest.fn(),
            handleChangeAdditional: jest.fn(),
            handleSaveContactClick: jest.fn(),
            handleSaveAdditionalClick: jest.fn(),
            handleFetchCurrentUser: jest.fn(),
        });

        render(<ProfilePage />);

        expect(screen.getByText(/Имя пользователя:/)).toHaveTextContent(
            'Имя пользователя: testuser'
        );
        expect(screen.getByText(/Адрес электронной почты:/)).toHaveTextContent(
            'Адрес электронной почты: test@example.com'
        );
        expect(screen.getByText(/О себе:/)).toHaveTextContent(
            'О себе: Информация о пользователе'
        );
    });

    test('allows editing contact information', () => {
        CamerasHandlers.default.mockReturnValue({
            loading: false,
            error: null,
            setLoading: jest.fn(),
        });
        const mockEditContactClick = jest.fn();
        ProfileHandlers.default.mockReturnValue({
            username: 'testuser',
            email: 'test@example.com',
            isEditingContact: false,
            isEditingAdditional: false,
            about: 'Информация о пользователе',
            handleEditContactClick: mockEditContactClick,
            handleEditAdditionalClick: jest.fn(),
            handleChangeContact: jest.fn(),
            handleChangeAdditional: jest.fn(),
            handleSaveContactClick: jest.fn(),
            handleSaveAdditionalClick: jest.fn(),
            handleFetchCurrentUser: jest.fn(),
        });

        render(<ProfilePage />);

        const editButton = screen.getAllByText(/Редактировать/);
        fireEvent.click(editButton);

        expect(mockEditContactClick).toHaveBeenCalled();
    });

    test('allows saving edited contact information', () => {
        CamerasHandlers.default.mockReturnValue({
            loading: false,
            error: null,
            setLoading: jest.fn(),
        });
        const mockSaveContactClick = jest.fn();
        ProfileHandlers.default.mockReturnValue({
            username: 'testuser',
            email: 'test@example.com',
            isEditingContact: true,
            isEditingAdditional: false,
            about: 'Информация о пользователе',
            handleEditContactClick: jest.fn(),
            handleEditAdditionalClick: jest.fn(),
            handleChangeContact: jest.fn(),
            handleChangeAdditional: jest.fn(),
            handleSaveContactClick: mockSaveContactClick,
            handleSaveAdditionalClick: jest.fn(),
            handleFetchCurrentUser: jest.fn(),
        });

        render(<ProfilePage />);

        const saveButton = screen.getByText(/Сохранить/);
        fireEvent.click(saveButton);

        expect(mockSaveContactClick).toHaveBeenCalled();
    });
});
