import React, { useState, useEffect, useRef } from 'react';

function ThemeSwitcher() {
  const themes = [
    { name: 'Cerulean', value: 'cerulean' },
    { name: 'Cosmo', value: 'cosmo' },
    { name: 'Cyborg', value: 'cyborg' },
    { name: 'Darkly', value: 'darkly' },
    { name: 'Flatly', value: 'flatly' },
    { name: 'Journal', value: 'journal' },
    { name: 'Litera', value: 'litera' },
    { name: 'Lumen', value: 'lumen' },
    { name: 'Lux', value: 'lux' },
    { name: 'Materia', value: 'materia' },
    { name: 'Minty', value: 'minty' },
    { name: 'Pulse', value: 'pulse' },
    { name: 'Sandstone', value: 'sandstone' },
    { name: 'Simplex', value: 'simplex' },
    { name: 'Sketchy', value: 'sketchy' },
    { name: 'Slate', value: 'slate' },
    { name: 'Solar', value: 'solar' },
    { name: 'Spacelab', value: 'spacelab' },
    { name: 'Superhero', value: 'superhero' },
    { name: 'United', value: 'united' },
    { name: 'Yeti', value: 'yeti' }
  ];

  // Get theme from localStorage or use cerulean as default
  const [currentTheme, setCurrentTheme] = useState(
    localStorage.getItem('theme') || 'cosmo'
  );
  
  // For dropdown toggle functionality
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Apply theme change
  useEffect(() => {
    const themeLink = document.getElementById('theme-link');
    if (themeLink) {
      themeLink.href = `https://cdn.jsdelivr.net/npm/bootswatch@5.3.2/dist/${currentTheme}/bootstrap.min.css`;
      localStorage.setItem('theme', currentTheme);
    }
  }, [currentTheme]);

  const handleThemeChange = (themeValue) => {
    setCurrentTheme(themeValue);
    setIsOpen(false); // Close dropdown after selection
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Find current theme name
  const currentThemeName = themes.find(theme => theme.value === currentTheme)?.name || 'Cerulean';

  return (
    <div className="position-relative" ref={dropdownRef}>
      <button 
        className="btn btn-secondary" 
        type="button" 
        onClick={toggleDropdown}
      >
        Theme: {currentThemeName}
      </button>
      
      {isOpen && (
        <div className="position-absolute end-0 mt-1" style={{ zIndex: 1000, width: '200px' }}>
          <ul className="list-group shadow">
            {themes.map(theme => (
              <li 
                key={theme.value} 
                className={`list-group-item ${currentTheme === theme.value ? 'active' : ''}`}
                onClick={() => handleThemeChange(theme.value)}
                style={{ cursor: 'pointer' }}
              >
                {theme.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ThemeSwitcher;