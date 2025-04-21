import { useEffect } from 'react';
import DataHandlers from '../DataPages/DataHandlers';

function PdfViewer() {
    const { extractedText, extractText, formatTextWithDates } = DataHandlers();

    useEffect(() => {
        extractText();
    }, [extractText]);

    return (
        <div>
            <pre> {formatTextWithDates(extractedText)}</pre>
        </div>
    );
}

export default PdfViewer;
