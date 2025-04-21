import { useSelector } from 'react-redux';
import { useState } from 'react';
import pdfToText from 'react-pdftotext';

const DataHandlers = () => {
    const [extractedText, setExtractedText] = useState('');
    const files = useSelector((state) => state.files);

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

    const handleDownload = (file) => {
        const fileUrl = URL.createObjectURL(file);

        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = file.name;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return {
        files,
        extractedText,
        extractText,
        formatTextWithDates,
        handleDownload,
    };
};

export default DataHandlers;
