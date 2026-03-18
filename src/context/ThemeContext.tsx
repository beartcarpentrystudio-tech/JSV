import React, { createContext, useContext, useEffect, useState } from 'react';

export interface ThemeConfig {
  ACCENT_COLOR: string;
  CORE_SIZE_M1: string;
  WING_OFFSET_M1: string;
  BACKGROUND_ASSET: string;
  BUTTON_OPACITY: string;
  BASE_COLOR?: string;
}

export interface ThemePreset {
  PRESET_ID: string;
  DESCRIPTION: string;
  CONFIG: ThemeConfig;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    PRESET_ID: "T001_NYX_DEFAULT",
    DESCRIPTION: "Orange/Black mutante.",
    CONFIG: {
      ACCENT_COLOR: "#f39c12",
      CORE_SIZE_M1: "95vh",
      WING_OFFSET_M1: "1200px",
      BACKGROUND_ASSET: "carbon-fibre",
      BUTTON_OPACITY: "0.9",
      BASE_COLOR: "#000000"
    }
  },
  {
    PRESET_ID: "T002_LUXURY_BLACK",
    DESCRIPTION: "Luxury Black / Cristal Clear (Cyan Accent).",
    CONFIG: {
      ACCENT_COLOR: "#00ffff",
      CORE_SIZE_M1: "80vh",
      WING_OFFSET_M1: "1000px",
      BACKGROUND_ASSET: "black-gloss",
      BUTTON_OPACITY: "0.7",
      BASE_COLOR: "#050505"
    }
  },
  {
    PRESET_ID: "T003_AQUILA_GREEN",
    DESCRIPTION: "Alto contraste Neón.",
    CONFIG: {
      ACCENT_COLOR: "#00ff44",
      CORE_SIZE_M1: "90vh",
      WING_OFFSET_M1: "1100px",
      BACKGROUND_ASSET: "dark-grid",
      BUTTON_OPACITY: "1.0",
      BASE_COLOR: "#000000"
    }
  },
  {
    PRESET_ID: "T004_MINIMAL_WHITE",
    DESCRIPTION: "Minimalista Blanco y Gris Claro.",
    CONFIG: {
      ACCENT_COLOR: "#aaaaaa",
      CORE_SIZE_M1: "85vh",
      WING_OFFSET_M1: "1000px",
      BACKGROUND_ASSET: "white-clean",
      BUTTON_OPACITY: "0.9",
      BASE_COLOR: "#f3f4f6"
    }
  }
];

interface ThemeContextType {
  currentThemeId: string;
  applyTheme: (themeId: string) => void;
  currentConfig: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentThemeId, setCurrentThemeId] = useState("T001_NYX_DEFAULT");

  const applyTheme = (themeId: string) => {
    const theme = THEME_PRESETS.find(t => t.PRESET_ID === themeId);
    if (!theme) return;

    setCurrentThemeId(themeId);

    // Apply CSS Variables
    const root = document.documentElement;
    root.style.setProperty('--color-jsv-orange', theme.CONFIG.ACCENT_COLOR);
    root.style.setProperty('--core-size-M1-override', theme.CONFIG.CORE_SIZE_M1);
    root.style.setProperty('--wing-offset-M1-override', theme.CONFIG.WING_OFFSET_M1);
    
    // Apply Base Color
    if (theme.CONFIG.BASE_COLOR) {
      document.body.style.backgroundColor = theme.CONFIG.BASE_COLOR;
      // Simple contrast check for text color
      const isLight = theme.CONFIG.BASE_COLOR === '#f3f4f6';
      document.body.style.color = isLight ? '#1a1a1a' : '#00ff00';
      // We might need to update a CSS variable for text color to propagate to components
      root.style.setProperty('--color-jsv-green', isLight ? '#1a1a1a' : '#00ff00');
    }
  };

  // Initialize with default
  useEffect(() => {
    applyTheme(currentThemeId);
  }, []);

  const currentConfig = THEME_PRESETS.find(t => t.PRESET_ID === currentThemeId)?.CONFIG || THEME_PRESETS[0].CONFIG;

  return (
    <ThemeContext.Provider value={{ currentThemeId, applyTheme, currentConfig }}>
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
