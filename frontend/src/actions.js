export const setSelectedCameraIndexRedux = (index) => ({
    type: 'SET_SELECTED_CAMERA_INDEX',
    payload: index,
});

export const addFiles = (files) => ({
    type: 'ADD_FILES',
    payload: files,
});
