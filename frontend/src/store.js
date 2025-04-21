import { createStore } from 'redux';

// Начальное состояние
const initialState = {
    selectedCameraIndex: null,
    files: [],
};

// Редюсер
const reducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_SELECTED_CAMERA_INDEX':
            return {
                ...state,
                selectedCameraIndex: action.payload,
            };
        case 'ADD_FILES':
            return {
                ...state,
                files: [...state.files, ...action.payload],
            };
        default:
            return state;
    }
};

// Создание store
const store = createStore(reducer);

export default store;
