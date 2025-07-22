import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme doit être utilisé dans un ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('its_theme');
    return savedTheme || 'light';
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('its_sidebar_collapsed');
    return saved === 'true';
  });

  const [primaryColor, setPrimaryColor] = useState(() => {
    const saved = localStorage.getItem('its_primary_color');
    return saved || '#2c5aa0';
  });

  useEffect(() => {
    // Appliquer le thème au document
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('its_theme', theme);
  }, [theme]);

  useEffect(() => {
    // Sauvegarder l'état du sidebar
    localStorage.setItem('its_sidebar_collapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  useEffect(() => {
    // Appliquer la couleur primaire
    document.documentElement.style.setProperty('--color-primary', primaryColor);
    localStorage.setItem('its_primary_color', primaryColor);
  }, [primaryColor]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  const updatePrimaryColor = (color) => {
    setPrimaryColor(color);
  };

  const resetTheme = () => {
    setTheme('light');
    setSidebarCollapsed(false);
    setPrimaryColor('#2c5aa0');
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    sidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebar,
    primaryColor,
    updatePrimaryColor,
    resetTheme,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;