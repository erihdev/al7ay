import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system' | 'auto';

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  isAutoMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper to determine if it's daytime (6 AM - 6 PM)
const isDaytime = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as Theme;
      return stored || 'system';
    }
    return 'system';
  });

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  const resolveTheme = useCallback((): 'light' | 'dark' => {
    if (theme === 'auto') {
      // Auto mode: light during day (6 AM - 6 PM), dark at night
      return isDaytime() ? 'light' : 'dark';
    } else if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    
    const updateTheme = (animate = true) => {
      const resolvedTheme = resolveTheme();
      
      // Add transition class for smooth animation
      if (animate) {
        root.classList.add('theme-transitioning');
      }
      
      root.classList.remove('light', 'dark');
      root.classList.add(resolvedTheme);
      setActualTheme(resolvedTheme);
      
      // Remove transition class after animation completes
      if (animate) {
        setTimeout(() => {
          root.classList.remove('theme-transitioning');
        }, 500);
      }
    };

    updateTheme(false); // Initial load without animation

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (theme === 'system') {
        updateTheme(true);
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);

    // For auto mode, check every minute for time-based changes
    let autoInterval: NodeJS.Timeout | null = null;
    if (theme === 'auto') {
      autoInterval = setInterval(() => {
        updateTheme(true);
      }, 60000); // Check every minute
    }

    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
      if (autoInterval) {
        clearInterval(autoInterval);
      }
    };
  }, [theme, resolveTheme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('theme', newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, actualTheme, setTheme, isAutoMode: theme === 'auto' }}>
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
