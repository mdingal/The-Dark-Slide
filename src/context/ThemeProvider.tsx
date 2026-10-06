import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('dark');

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      let activeTheme: 'light' | 'dark' = 'dark';
      activeTheme = theme;

      setResolvedTheme(activeTheme);
      root.style.colorScheme = activeTheme;
      if (activeTheme === 'dark') {
        root.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        root.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    };

    applyTheme();


  }, [theme]);

  useEffect(() => {
    const apply = (event: Event) => setThemeState((event as CustomEvent).detail === 'light' ? 'light' : 'dark');
    window.addEventListener('rider-theme-loaded', apply);
    return () => window.removeEventListener('rider-theme-loaded', apply);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    window.dispatchEvent(new CustomEvent('rider-theme-change', { detail: newTheme }));
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
