import { useTheme as useThemeContext } from "../contexts/ThemeContext.jsx";

/**
 * Hook to access theme context
 * Re-export for consistent import pattern with other hooks
 *
 * @returns {object} Theme context value
 * @example
 * const { theme, toggleTheme, setTheme, isLight, isDark } = useTheme();
 */
export const useTheme = useThemeContext;

export default useTheme;
