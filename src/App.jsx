import { useState, useEffect } from 'react'
import { initSql, fileTob64, fetchAi, checkForAiError, fixAiCards, createDeck } from './ankiService';
import Header from './Header';
import './App.css';

function App() {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isSqlReady, setIsSqlReady] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const toggleTheme = () => setIsDarkMode(!isDarkMode);
    const [fileName, setFileName] = useState("No file selected");
    
    // initialize sql
    useEffect(() => {
        initSql()
            .then(() => setIsSqlReady(true))
            .catch(err => setError("SQL loading error: " + err.message));
        }, []);
    
    // when upload button is clicked
    const handleUpload = async (event) => {
        event.preventDefault();
        // init
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        const formData = new FormData(event.target);
        const file = formData.get("file");
        const apiKey = formData.get("key");
        // main logic using ankiService.js
        try {
            if(isSqlReady == false){
                throw new Error("System not initialized")
            }
            const b64 = await fileTob64(file);
            let json = await fetchAi(b64, file.type, apiKey);
            // if dict is empty
            const {badCards, goodCards} = checkForAiError(json);
            if(badCards.length > 0){
                let fixedCards = await fixAiCards(badCards, apiKey);
                json = goodCards.concat(fixedCards);
                /*console.log("--- DEBUGGING INFO ---"); 
                console.log("Amount Good Cards:", goodCards.length);
                console.log("Amount Bad Cards:", badCards.length);
                console.log("Final JSON Array Length:", json.length);
                console.log("Content Corrected Cards:", fixedCards);
                console.log("Content Final Cards:", json);*/
            }
            createDeck(json);
            setSuccess(true);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }

    }

    return (
        <div className={`theme-wrapper ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
            <Header isDarkMode={isDarkMode} onToggle={toggleTheme} />
            <form className="upload-form" onSubmit={handleUpload}>
                <div className="input-fields">
                    <div className="input-box">
                        <label className="input-describtion">Upload your Image:</label>
                        <label className="custom-file-upload">
                            <span className="button-text">📁 Select file</span>
                            <input 
                                type="file" 
                                name="file" 
                                className="hidden-input"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setFileName(e.target.files[0].name);
                                    } else {
                                        setFileName("No file selected");
                                    }
                                }}
                            />
                        </label>
                        <span className="file-name-display">{fileName}</span>
                    </div>
                    <div className="input-box">
                        <label className="input-describtion">API key:</label>
                        <input type="password" name="key" />
                    </div>
                </div>
                <button className="submit-button" type="submit" disabled={isLoading || !isSqlReady} >{isLoading ? "Busy..." : "Create Deck"}</button>
            </form>
            {isLoading && (<div id="loader">Loading...</div>)}
            
            {error && (<div id="error">{error}</div>)}
            {success && (<div id="error">Deck successfully generated!</div>)}
        </div>
    )
}

export default App
