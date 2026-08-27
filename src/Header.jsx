import './Header.css';

export default function Header({ isDarkMode, onToggle }) {
    return (
        <header className="main-header">
            <div className='header-container'>
                <a className="header-element">AnkiGenerator</a>
                <button onClick={onToggle} className="header-element">
                    {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
            </div>
            

            
        </header>
    );
}