// import { render, screen, fireEvent } from '@testing-library/react';
// import { Provider } from 'react-redux';
// import store from '../../store';
// import ReportPage from './ReportPage';
// import DataHandlers from './DataHandlers';
// import NavigationHandlers from '../GeneralComponents/NavigationHandlers';

// jest.mock('./DataHandlers');
// jest.mock('../GeneralComponents/NavigationHandlers');
// jest.mock('../UI/ButtonWithTooltip', () => ({ altText, onClick }) => (
//     <button aria-label={altText} onClick={onClick}>
//         {altText}
//     </button>
// ));

// describe('ReportPage Component', () => {
//     const onLogoutMock = jest.fn();
//     const goToCamerasHandlerMock = jest.fn();
//     const logoutHandlerMock = jest.fn();
//     const handleDownloadMock = jest.fn();

//     beforeEach(() => {
//         NavigationHandlers.mockReturnValue({
//             goToCamerasHandler: goToCamerasHandlerMock,
//             logoutHandler: logoutHandlerMock,
//         });

//         DataHandlers.mockReturnValue({
//             files: [],
//             handleDownload: handleDownloadMock,
//         });

//         render(
//             <Provider store={store}>
//                 <ReportPage onLogout={onLogoutMock} />
//             </Provider>
//         );
//     });

//     afterEach(() => {
//         jest.clearAllMocks();
//     });

//     test('renders correctly with no files', () => {
//         expect(screen.getByText('Список файлов')).toBeInTheDocument();
//         expect(screen.getByText('Файлы отсутствуют')).toBeInTheDocument();
//         expect(PdfViewer).not.toHaveBeenCalled();
//     });

//     test('renders correctly with files', () => {
//         const mockFiles = ['file1.pdf'];
//         DataHandlers.mockReturnValue({
//             files: mockFiles,
//             handleDownload: handleDownloadMock,
//         });

//         expect(screen.getByText('Список файлов')).toBeInTheDocument();
//         expect(PdfViewer).toHaveBeenCalledWith({ value: mockFiles[0] }, {});
//         expect(
//             screen.getByRole('button', { name: /Скачать/i })
//         ).toBeInTheDocument();
//     });

//     test('calls handleDownload when download button is clicked', () => {
//         const mockFiles = ['file1.pdf'];
//         DataHandlers.mockReturnValue({
//             files: mockFiles,
//             handleDownload: handleDownloadMock,
//         });

//         fireEvent.click(screen.getByRole('button', { name: /Скачать/i }));
//         expect(handleDownloadMock).toHaveBeenCalledWith(mockFiles[0]);
//     });

//     test('calls navigation handlers on button clicks', () => {
//         fireEvent.click(screen.getByLabelText('Назад'));
//         expect(goToCamerasHandlerMock).toHaveBeenCalled();

//         fireEvent.click(screen.getByLabelText('Выход'));
//         expect(logoutHandlerMock).toHaveBeenCalled();
//     });
// });
