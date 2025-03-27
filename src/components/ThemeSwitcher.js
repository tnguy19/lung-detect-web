import React, { useState, useEffect } from 'react';

// Component for theme switching
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
    localStorage.getItem('theme') || 'cerulean'
  );

  // Force the theme to be applied on component mount and when theme changes
  useEffect(() => {
    // Remove any existing theme link with id 'bootswatch-theme'
    const existingLink = document.getElementById('bootswatch-theme');
    if (existingLink) {
      existingLink.remove();
    }
    
    // Create and append a new link element
    const link = document.createElement('link');
    link.id = 'bootswatch-theme';
    link.rel = 'stylesheet';
    link.href = `https://cdn.jsdelivr.net/npm/bootswatch@5.3.2/dist/${currentTheme}/bootstrap.min.css`;
    document.head.appendChild(link);
    
    // // Save to localStorage
    // localStorage.setItem('theme', currentTheme);
    
    // // Log for debugging
    // console.log(`Applied theme: ${currentTheme}`);
    
  }, [currentTheme]);

  const handleThemeChange = (e) => {
    setCurrentTheme(e.target.value);
  };

  return (
    <select 
      className="form-select form-select-sm bg-transparent text-white border-0 mx-2" 
      style={{ maxWidth: '120px' }}
      value={currentTheme}
      onChange={handleThemeChange}
      aria-label="Select theme"
    >
      {themes.map(theme => (
        <option key={theme.value} value={theme.value}>
          {theme.name}
        </option>
      ))}
    </select>
  );
}

export default ThemeSwitcher;