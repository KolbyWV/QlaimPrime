import React, { createContext, useContext, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

import { useSession } from "../../auth/session";
import { darkTheme, lightTheme } from "./palette";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { mode } = useSession();
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState(
    systemScheme === "dark" ? "dark" : "light",
  );
  const isCompanyMode = mode === "company";

  const value = useMemo(() => {
    const baseTheme = themeMode === "dark" ? darkTheme : lightTheme;
    const companyAccent = "#023e8a";
    const theme = isCompanyMode
      ? {
          ...baseTheme,
          colors: {
            ...baseTheme.colors,
            primary: companyAccent,
            accent: companyAccent,
            warning: companyAccent,
            accentSoft: themeMode === "dark" ? "#13345f" : "#d6e7ff",
            iconBubble: themeMode === "dark" ? "#1d4f86" : "#b5d2ff",
          },
        }
      : baseTheme;
    return {
      theme,
      themeMode,
      setThemeMode,
      toggleThemeMode: () => {
        setThemeMode((prev) => (prev === "dark" ? "light" : "dark"));
      },
    };
  }, [isCompanyMode, themeMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within ThemeProvider.");
  }
  return context;
}
