import { setSelectedCameraIndexRedux, addFiles } from './actions'; // Укажите правильный путь к вашему файлу

describe('Redux Action Creators', () => {
    test('setSelectedCameraIndexRedux should create an action to set selected camera index', () => {
        const index = 1; // Пример индекса камеры
        const expectedAction = {
            type: 'SET_SELECTED_CAMERA_INDEX',
            payload: index,
        };

        expect(setSelectedCameraIndexRedux(index)).toEqual(expectedAction);
    });

    test('addFiles should create an action to add files', () => {
        const files = ['file1.jpg', 'file2.png']; // Пример файлов
        const expectedAction = {
            type: 'ADD_FILES',
            payload: files,
        };

        expect(addFiles(files)).toEqual(expectedAction);
    });
});
