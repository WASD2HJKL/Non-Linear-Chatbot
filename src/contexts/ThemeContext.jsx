import { createContext, useContext, useState, useEffect } from "react";
import { LAYOUT_CONSTANTS } from "../constants/layoutConstants";

const ThemeContext = createContext();

/**
 * Detect system theme preference
 * @returns {string} 'light' or 'dark'
 */
const getSystemTheme = () => {
    if (typeof window !== "undefined" && window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? LAYOUT_CONSTANTS.THEMES.DARK
            : LAYOUT_CONSTANTS.THEMES.LIGHT;
    }
    return LAYOUT_CONSTANTS.THEMES.LIGHT;
};

/**
 * Get stored theme preference or system default
 * @returns {string} Theme preference
 */
const getStoredTheme = () => {
    if (typeof window !== "undefined") {
        const stored = localStorage.getItem(LAYOUT_CONSTANTS.STORAGE_KEYS.THEME);
        if (stored && Object.values(LAYOUT_CONSTANTS.THEMES).includes(stored)) {
            return stored;
        }
    }
    return getSystemTheme();
};

/**
 * Apply theme to document
 * @param {string} theme - Theme to apply
 */
const applyTheme = (theme) => {
    if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", theme);
    }
};

/**
 * Theme Provider Component
 * Manages global theme state with system preference detection and persistence
 */
export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(() => {
        const storedTheme = getStoredTheme();
        // Apply theme immediately to prevent flash
        applyTheme(storedTheme);
        return storedTheme;
    });

    /**
     * Set theme with persistence
     * @param {string} newTheme - Theme to set
     */
    const setTheme = (newTheme) => {
        if (Object.values(LAYOUT_CONSTANTS.THEMES).includes(newTheme)) {
            setThemeState(newTheme);
            applyTheme(newTheme);
            if (typeof window !== "undefined") {
                localStorage.setItem(LAYOUT_CONSTANTS.STORAGE_KEYS.THEME, newTheme);
            }
        }
    };

    /**
     * Toggle between light and dark themes
     */
    const toggleTheme = () => {
        const newTheme =
            theme === LAYOUT_CONSTANTS.THEMES.LIGHT ? LAYOUT_CONSTANTS.THEMES.DARK : LAYOUT_CONSTANTS.THEMES.LIGHT;
        setTheme(newTheme);
    };

    // Listen for system theme changes
    useEffect(() => {
        if (typeof window !== "undefined" && window.matchMedia) {
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

            const handleChange = (e) => {
                // Only update if no explicit theme preference is stored
                const stored = localStorage.getItem(LAYOUT_CONSTANTS.STORAGE_KEYS.THEME);
                if (!stored) {
                    const systemTheme = e.matches ? LAYOUT_CONSTANTS.THEMES.DARK : LAYOUT_CONSTANTS.THEMES.LIGHT;
                    setTheme(systemTheme);
                }
            };

            mediaQuery.addEventListener("change", handleChange);
            return () => mediaQuery.removeEventListener("change", handleChange);
        }
    }, []);

    // Apply theme changes to document
    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const value = {
        theme,
        setTheme,
        toggleTheme,
        isLight: theme === LAYOUT_CONSTANTS.THEMES.LIGHT,
        isDark: theme === LAYOUT_CONSTANTS.THEMES.DARK,
        systemTheme: getSystemTheme(),
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/**
 * Hook to use theme context
 * @returns {object} Theme context value
 * @throws {Error} If used outside ThemeProvider
 */
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};

export default ThemeContext;
