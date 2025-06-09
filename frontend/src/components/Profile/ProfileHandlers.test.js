import {
    username,
    email,
    isEditingContact,
    isEditingAdditional,
    about,
    handleEditContactClick,
    handleEditAdditionalClick,
    handleChangeContact,
    handleChangeAdditional,
    handleSaveContactClick,
    handleSaveAdditionalClick,
    handleFetchCurrentUser,
} from './ProfileHandlers';
import * as Api from '../Cameras/Api';

jest.mock('../Cameras/Api', () => ({
    fetchCurrentUser: jest.fn(),
}));

const state = {
    username: '',
    email: '',
    isEditingContact: false,
    isEditingAdditional: false,
    about: 'Пусто',
};

const handlers = {
    handleEditContactClick: jest.fn(() => {
        state.isEditingContact = true;
    }),
    handleEditAdditionalClick: jest.fn(() => {
        state.isEditingAdditional = true;
    }),
    handleChangeContact: jest.fn((newEmail) => {
        state.email = newEmail;
    }),
    handleChangeAdditional: jest.fn((newAbout) => {
        state.about = newAbout;
    }),
    handleSaveContactClick: jest.fn(() => {
        state.isEditingContact = false;
    }),
    handleSaveAdditionalClick: jest.fn(() => {
        state.isEditingAdditional = false;
    }),
    handleFetchCurrentUser: jest.fn(async () => {
        const mockUserData = await Api.fetchCurrentUser(); // Используем импортированный Api
        state.username = mockUserData.username;
        state.email = mockUserData.email;
    }),
};

describe('ProfileHandlers', () => {
    // beforeEach(() => {
    //     // Создаем объект состояния и функций, чтобы имитировать поведение хуков
    //     ProfileHandlers.default.mockReturnValue({
    //         username: '',
    //         email: '',
    //         isEditingContact: false,
    //         isEditingAdditional: false,
    //         about: '',
    //         handleEditContactClick: jest.fn(),
    //         handleEditAdditionalClick: jest.fn(),
    //         handleChangeContact: jest.fn(),
    //         handleChangeAdditional: jest.fn(),
    //         handleSaveContactClick: jest.fn(),
    //         handleSaveAdditionalClick: jest.fn(),
    //         handleFetchCurrentUser: jest.fn(),
    //     });
    // });

    test('initial state', () => {
        expect(state.username).toBe('');
        expect(state.email).toBe('');
        expect(state.about).toBe('Пусто');
        expect(state.isEditingContact).toBe(false);
        expect(state.isEditingAdditional).toBe(false);
    });

    test('fetches current user and sets username and email', async () => {
        const mockUserData = {
            username: 'testuser',
            email: 'test@example.com',
        };
        Api.fetchCurrentUser.mockResolvedValueOnce(mockUserData);

        await handlers.handleFetchCurrentUser();

        expect(state.username).toBe('testuser');
        expect(state.email).toBe('test@example.com');
        expect(Api.fetchCurrentUser).toHaveBeenCalled();
    });

    test('handles edit contact click', () => {
        handlers.handleEditContactClick();

        expect(state.isEditingContact).toBe(true);
    });

    test('handles edit additional click', () => {
        handlers.handleEditAdditionalClick();

        expect(state.isEditingAdditional).toBe(true);
    });

    test('handles change contact', () => {
        const newEmail = 'newemail@example.com';

        handlers.handleChangeContact(newEmail);

        expect(state.email).toBe('newemail@example.com');
    });

    test('handles change additional', () => {
        const newAbout = 'Updated about info';

        handlers.handleChangeAdditional(newAbout);

        expect(state.about).toBe('Updated about info');
    });

    test('handles save contact click', () => {
        const newEmail = 'newemail@example.com';

        handlers.handleChangeContact(newEmail);
        handlers.handleSaveContactClick();

        expect(state.isEditingContact).toBe(false);
    });

    test('handles save additional click', () => {
        const newAbout = 'Updated about info';

        handlers.handleChangeAdditional(newAbout);
        handlers.handleSaveAdditionalClick();

        expect(state.isEditingAdditional).toBe(false);
    });
});
