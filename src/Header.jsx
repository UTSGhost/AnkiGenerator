import './Header.css';

export default function Header({ isDarkMode, onToggle }) {
    return (
        <header className="main-header">
            <div className='header-container'>
                <a href="#a" className="header-element">About me</a>
                <a className="header-element">Projects</a>
                <a className="header-element">Idk what I need</a>
                <button onClick={onToggle} className="header-element">
                    {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
            </div>
            

            
        </header>
    );
}