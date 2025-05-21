import { useSelector } from 'react-redux';
import { useState, useRef } from 'react';
import pdfToText from 'react-pdftotext';
import {
    fetchPersons,
    addPerson,
    addFace,
    updatePerson,
    deletePerson,
} from '../Cameras/Api';
import { useDispatch } from 'react-redux';
import { addFiles } from '../../actions';

const DataHandlers = () => {
    const fileInputRef = useRef(null);
    const [extractedText, setExtractedText] = useState('');
    const files = useSelector((state) => state.files);
    const [persons, setPersons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newPerson, setNewPerson] = useState({ name: '' });
    const [newFace, setNewFace] = useState([]);
    const [isUploadWindowOpen, setIsUploadWindowOpen] = useState(false);
    const [isEditWindowOpen, setIsEditWindowOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState('');
    const [selectedPersonIndex, setSelectedPersonIndex] = useState(null);
    const [selectedPersonId, setSelectedPersonId] = useState(null);
    const dispatch = useDispatch();

    const extractText = () => {
        if (files) {
            const file = files[0];
            pdfToText(file)
                .then((text) => setExtractedText(text))
                .catch((error) =>
                    console.error('Failed to extract text from pdf')
                );
        }
    };

    const formatTextWithDates = (text) => {
        const lines = text.split('.');

        const formattedText = lines
            .map((line, index) => {
                return `\n${line}`;
            })
            .join('');

        return formattedText.trim();
    };

    const handleUploadLogsFile = () => {
        dispatch(addFiles('../../../public/files/person_detection_report.pdf'));
    };

    const handleDownload = (file) => {
        const fileUrl = URL.createObjectURL(file);

        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = file.name;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFetchPersons = async () => {
        try {
            const data = await fetchPersons();
            setPersons(data);
        } catch (error) {
            handleError(
                'Ошибка при получении информации о сотрудниках:',
                error
            );
        } finally {
            setLoading(false);
        }
    };

    const handleAddPerson = async () => {
        try {
            await addPerson(newPerson);
            setNewPerson({ name: '' });
            handleFetchPersons();
        } catch (error) {
            handleError('Ошибка при добавлении сотрудника:', error);
        }
    };

    const handleUpdatePerson = async (personId) => {
        try {
            await updatePerson(personId, newPerson);
            setNewPerson({ name: '' });
            setSelectedPerson('');
            setSelectedPersonId(null);
            handleFetchPersons();
        } catch (error) {
            handleError('Ошибка при обновлении сотрудника:', error);
        }
    };

    const handleDeletePerson = async (personId) => {
        try {
            await deletePerson(personId);
            // Обновляем состояние, удаляя сотрудника из списка
            setPersons(persons.filter((person) => person.id !== personId));
            handleFetchPersons();
        } catch (error) {
            handleError('Ошибка при удалении сотрудника: ' + error);
        }
    };

    const handleAddFace = async () => {
        try {
            await addFace(selectedPersonId, newFace);
            setNewFace([]);
            handleFetchPersons();
        } catch (error) {
            handleError('Ошибка при загрузке лиц сотрудников:', error);
        }
    };

    const handleCreatePerson = async () => {
        try {
            handleAddPerson();
            if (newFace.length > 0) {
                handleAddFace();
            }
            handleFetchPersons();
        } catch (error) {
            handleError('Ошибка при создании сотрудника:', error);
        }
    };

    const handleError = (error) => {
        setError(error);
        console.error(error);
    };

    const openUploadWindow = () => setIsUploadWindowOpen(true);
    const closeUploadWindow = () => setIsUploadWindowOpen(false);
    const openEditWindow = () => setIsEditWindowOpen(true);
    const closeEditWindow = () => setIsEditWindowOpen(false);

    const handleFileChange = (event) => {
        const files = event.target.files;
        setNewFace(files);
    };

    const handleButtonClick = () => {
        fileInputRef.current.click();
    };

    const handleStaffSelectChange = (event) => {
        const selectedValue = event.target.value;
        setSelectedPerson(selectedValue);
        const index = persons.findIndex(
            (person) => person.name === selectedValue
        );
        setSelectedPersonId(persons[index].id);
        setNewPerson(selectedValue);
    };

    const handlePersonClick = (index) => {
        if (selectedPersonIndex === index) {
            setSelectedPersonIndex(null);
        } else {
            setSelectedPersonIndex(index);
        }
    };

    return {
        files,
        newPerson,
        newFace,
        extractedText,
        persons,
        isUploadWindowOpen,
        isEditWindowOpen,
        loading,
        error,
        fileInputRef,
        selectedPerson,
        selectedPersonIndex,
        selectedPersonId,
        setNewPerson,
        extractText,
        formatTextWithDates,
        handleDownload,
        handleFetchPersons,
        handleCreatePerson,
        handleUpdatePerson,
        handleDeletePerson,
        handleAddFace,
        openUploadWindow,
        closeUploadWindow,
        openEditWindow,
        closeEditWindow,
        handleFileChange,
        handleButtonClick,
        handleStaffSelectChange,
        handlePersonClick,
        handleUploadLogsFile,
    };
};

export default DataHandlers;
