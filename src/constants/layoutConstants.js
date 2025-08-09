/**
 * Layout configuration constants
 * These values should match the CSS custom properties in variables.css
 */

export const LAYOUT_CONSTANTS = {
    // Sidebar Configuration
    SIDEBAR_WIDTH_EXPANDED: 250,
    SIDEBAR_WIDTH_COLLAPSED: 60,

    // Layout Spacing
    LAYOUT_MARGIN: 20,

    // Animation Timing
    TRANSITION_DURATION: "0.3s",

    // Panel Configuration
    PANEL_MIN_SIZE: 20,
    PANEL_DEFAULT_SIZE: 50,

    // Panel Resize Handle
    RESIZE_HANDLE_WIDTH: 4,

    // Breakpoints for responsive behavior
    BREAKPOINTS: {
        SM: 576,
        MD: 768,
        LG: 992,
        XL: 1200,
        XXL: 1400,
    },

    // Theme Names
    THEMES: {
        LIGHT: "light",
        DARK: "dark",
    },

    // Local Storage Keys
    STORAGE_KEYS: {
        THEME: "theme-preference",
        SIDEBAR_COLLAPSED: "sidebar-collapsed",
        PANEL_SIZES: "panel-sizes",
    },
};

/**
 * Get theme-aware layout configuration
 * @param {string} theme - Current theme ('light' or 'dark')
 * @returns {object} Layout configuration object
 */
export const getLayoutConfig = (theme = LAYOUT_CONSTANTS.THEMES.LIGHT) => {
    return {
        ...LAYOUT_CONSTANTS,
        theme,

        // Theme-specific overrides can be added here
        sidebarBackground: theme === LAYOUT_CONSTANTS.THEMES.DARK ? "#343a40" : "#f8f9fa",

        borderColor: theme === LAYOUT_CONSTANTS.THEMES.DARK ? "#495057" : "#dee2e6",
    };
};

export default LAYOUT_CONSTANTS;
