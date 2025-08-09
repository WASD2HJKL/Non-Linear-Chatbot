import React from "react";
import { useTheme } from "../../hooks/useTheme.js";
import styles from "./LayoutContainer.module.css";

/**
 * Main layout container component
 * Provides the overall structure for the application layout
 *
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} Layout container
 */
const LayoutContainer = ({ children, className = "" }) => {
    const { theme } = useTheme();

    return (
        <div className={`${styles.container} ${className}`} data-theme={theme}>
            {children}
        </div>
    );
};

export default LayoutContainer;
