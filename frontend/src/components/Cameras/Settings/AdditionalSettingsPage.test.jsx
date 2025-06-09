import { render, screen, fireEvent } from '@testing-library/react';
import AdditionalSettingsPage from './AdditionalSettingsPage';
import * as NavigationHandlers from '../../GeneralComponents/NavigationHandlers';

// Мокаем NavigationHandlers для тестирования
jest.mock('../../GeneralComponents/NavigationHandlers');
jest.mock('./NotificationSelector', () => () => (
    <div>NotificationSelector</div>
));
jest.mock('../../UI/ButtonWithTooltip', () => ({ onClick, altText }) => (
    <button onClick={onClick} aria-label={altText}>
        {altText}
    </button>
));

describe('AdditionalSettingsPage', () => {
    beforeEach(() => {
        NavigationHandlers.default.mockReturnValue({
            goToCamerasHandler: jest.fn(),
            logoutHandler: jest.fn(),
        });

        render(<AdditionalSettingsPage />);
    });

    test('renders the main elements', () => {
        expect(
            screen.getByText(/Дополнительные настройки/i)
        ).toBeInTheDocument();
        expect(screen.getByText(/Уведомление о событиях/i)).toBeInTheDocument();
    });

    test('renders the back and logout buttons', () => {
        const backButton = screen.getByText(/Назад/i);
        const logoutButton = screen.getByText(/Выход/i);

        expect(backButton).toBeInTheDocument();
        expect(logoutButton).toBeInTheDocument();
    });

    test('calls goToCamerasHandler when back button is clicked', () => {
        const { goToCamerasHandler } = NavigationHandlers();

        const backButton = screen.getByText(/Назад/i);
        fireEvent.click(backButton);

        expect(goToCamerasHandler).toHaveBeenCalled();
    });

    test('calls logoutHandler when logout button is clicked', () => {
        const { logoutHandler } = NavigationHandlers();

        const logoutButton = screen.getByText(/Выход/i);
        fireEvent.click(logoutButton);

        expect(logoutHandler).toHaveBeenCalled();
    });
});
