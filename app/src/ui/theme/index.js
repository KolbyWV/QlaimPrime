import React, { createContext, useContext, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

import { darkTheme, lightTheme } from "./palette";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState(
    systemScheme === "dark" ? "dark" : "light",
  );

  const value = useMemo(() => {
    const theme = themeMode === "dark" ? darkTheme : lightTheme;
    return {
      theme,
      themeMode,
      setThemeMode,
      toggleThemeMode: () => {
        setThemeMode((prev) => (prev === "dark" ? "light" : "dark"));
      },
    };
  }, [themeMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within ThemeProvider.");
  }
  return context;
}
