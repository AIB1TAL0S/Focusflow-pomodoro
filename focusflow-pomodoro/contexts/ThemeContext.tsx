import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemTheme = useColorScheme() ?? 'light';
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [isDark, setIsDark] = useState(systemTheme === 'dark');

  const updateIsDark = useCallback(() => {
    let newIsDark: boolean;
    if (theme === 'system') {
      newIsDark = systemTheme === 'dark';
    } else {
      newIsDark = theme === 'dark';
    }
    setIsDark(newIsDark);
  }, [theme, systemTheme]);

  useEffect(() => {
    updateIsDark();
  }, [updateIsDark]);

  const handleSetTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}