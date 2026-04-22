import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AppColorScheme = "dark" | "light";

type ThemeContextValue = {
  colorScheme: AppColorScheme;
  isDarkMode: boolean;
  setColorScheme: (scheme: AppColorScheme) => void;
  toggleColorScheme: () => void;
};

const THEME_STORAGE_KEY = "app-color-scheme";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveInitialColorScheme(): AppColorScheme {
  if (typeof window === "undefined") {
    return "dark";
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark" || stored === "light") {
    return stored;
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [colorScheme, setColorSchemeState] = useState<AppColorScheme>(
    resolveInitialColorScheme,
  );

  const setColorScheme = useCallback((scheme: AppColorScheme) => {
    setColorSchemeState(scheme);
  }, []);

  const toggleColorScheme = useCallback(() => {
    setColorSchemeState((previous) => (previous === "dark" ? "light" : "dark"));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, colorScheme);
  }, [colorScheme]);

  const value = useMemo(
    () => ({
      colorScheme,
      isDarkMode: colorScheme === "dark",
      setColorScheme,
      toggleColorScheme,
    }),
    [colorScheme, setColorScheme, toggleColorScheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }

  return context;
}
