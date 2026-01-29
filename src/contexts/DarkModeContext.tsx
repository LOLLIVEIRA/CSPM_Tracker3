import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DarkModeContextType {
  isDark: boolean;
  toggle: () => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) {
        const isDarkMode = saved === 'dark';
        // Aplicar imediatamente para evitar flash
        const root = window.document.documentElement;
        if (isDarkMode) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        return isDarkMode;
      }
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      // Aplicar imediatamente
      const root = window.document.documentElement;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      return prefersDark;
    }
    return true; // Default to dark
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Escutar mudanças no sistema operacional
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        // Só atualizar se não houver preferência salva
        if (!localStorage.getItem('theme')) {
          setIsDark(e.matches);
        }
      };
      
      // Adicionar listener para mudanças
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else {
        // Fallback para browsers antigos
        mediaQuery.addListener(handleChange);
      }

      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleChange);
        } else {
          mediaQuery.removeListener(handleChange);
        }
      };
    }
  }, []);

  const toggle = () => setIsDark(prev => !prev);

  return (
    <DarkModeContext.Provider value={{ isDark, toggle }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
}

