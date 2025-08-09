import { useState, useEffect } from "react";
import { LAYOUT_CONSTANTS } from "../constants/layoutConstants";

/**
 * Custom hook for managing sidebar collapsed state
 * Provides state management with localStorage persistence
 *
 * @param {boolean} initialCollapsed - Initial collapsed state (default: false)
 * @returns {object} Sidebar state and controls
 */
export const useSidebarState = (initialCollapsed = false) => {
    const [collapsed, setCollapsedState] = useState(() => {
        // Try to get stored preference
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem(LAYOUT_CONSTANTS.STORAGE_KEYS.SIDEBAR_COLLAPSED);
            if (stored !== null) {
                return JSON.parse(stored);
            }
        }
        return initialCollapsed;
    });

    /**
     * Set collapsed state with persistence
     * @param {boolean} newCollapsed - New collapsed state
     */
    const setCollapsed = (newCollapsed) => {
        setCollapsedState(newCollapsed);
        if (typeof window !== "undefined") {
            localStorage.setItem(LAYOUT_CONSTANTS.STORAGE_KEYS.SIDEBAR_COLLAPSED, JSON.stringify(newCollapsed));
        }
    };

    /**
     * Toggle collapsed state
     */
    const toggle = () => {
        setCollapsed(!collapsed);
    };

    /**
     * Get current sidebar width based on collapsed state
     * @returns {number} Current sidebar width in pixels
     */
    const getSidebarWidth = () => {
        return collapsed ? LAYOUT_CONSTANTS.SIDEBAR_WIDTH_COLLAPSED : LAYOUT_CONSTANTS.SIDEBAR_WIDTH_EXPANDED;
    };

    /**
     * Check if sidebar should show text (not collapsed)
     * @returns {boolean} True if text should be shown
     */
    const shouldShowText = () => {
        return !collapsed;
    };

    // Persist state changes
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem(LAYOUT_CONSTANTS.STORAGE_KEYS.SIDEBAR_COLLAPSED, JSON.stringify(collapsed));
        }
    }, [collapsed]);

    return {
        collapsed,
        setCollapsed,
        toggle,
        getSidebarWidth,
        shouldShowText,

        // Computed values for convenience
        width: getSidebarWidth(),
        showText: shouldShowText(),
    };
};

export default useSidebarState;
