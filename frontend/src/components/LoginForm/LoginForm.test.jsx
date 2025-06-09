// import { render, screen, fireEvent } from '@testing-library/react';
// import { useNavigate } from 'react-router';
// import LoginForm from './LoginForm';
// import { useAuth } from './AuthContext';

// jest.mock('react-router', () => ({
//     ...jest.requireActual('react-router'),
//     useNavigate: jest.fn(),
// }));

// // Мокаем контекст useAuth
// jest.mock('./AuthContext', () => ({
//     useAuth: jest.fn(),
// }));

// // Мокаем useNavigate
// // jest.mock('react-router', () => ({
// //     useNavigate: jest.fn(),
// // }));

// describe('LoginForm Component', () => {
//     const mockNavigate = jest.fn();

//     beforeEach(() => {
//         useNavigate.mockReturnValue(mockNavigate);
//     });

//     afterEach(() => {
//         jest.clearAllMocks();
//     });

//     test('renders login form correctly', () => {
//         render(<LoginForm />);

//         expect(screen.getByText(/вход/i)).toBeInTheDocument();
//         expect(screen.getByPlaceholderText(/логин/i)).toBeInTheDocument();
//         expect(screen.getByPlaceholderText(/пароль/i)).toBeInTheDocument();
//         expect(
//             screen.getByRole('button', { name: /войти/i })
//         ).toBeInTheDocument();
//     });

//     test('allows user to input login and password', () => {
//         render(<LoginForm />);

//         const loginInput = screen.getByPlaceholderText(/логин/i);
//         const passwordInput = screen.getByPlaceholderText(/пароль/i);

//         fireEvent.change(loginInput, { target: { value: 'testUser' } });
//         fireEvent.change(passwordInput, { target: { value: 'password123' } });

//         expect(loginInput.value).toBe('testUser');
//         expect(passwordInput.value).toBe('password123');
//     });

//     test('navigates to /cameras on form submit', async () => {
//         render(<LoginForm />);

//         const loginInput = screen.getByPlaceholderText(/логин/i);
//         const passwordInput = screen.getByPlaceholderText(/пароль/i);
//         const submitButton = screen.getByRole('button', { name: /войти/i });

//         fireEvent.change(loginInput, { target: { value: 'testUser' } });
//         fireEvent.change(passwordInput, { target: { value: 'password123' } });
//         fireEvent.click(submitButton);

//         expect(mockNavigate).toHaveBeenCalledWith('/cameras');
//     });
// });
