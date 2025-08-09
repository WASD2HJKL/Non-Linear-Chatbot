import React from "react";
import { Button } from "react-bootstrap";
import { Gear, BoxArrowRight, Sun, Moon } from "react-bootstrap-icons";
import { logout } from "wasp/client/auth";
import { useTheme } from "../../hooks/useTheme.js";
import useSidebarState from "../../hooks/useSidebarState";
import styles from "./Sidebar.module.css";

/**
 * Sidebar navigation component
 * Provides collapsible navigation with theme switching
 *
 * @param {object} props - Component props
 * @param {object} props.user - Current user object
 * @param {function} props.onNewChat - Handler for new chat creation
 * @param {function} props.onShowSettings - Handler for showing settings modal
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} Sidebar component
 */
const Sidebar = ({ user, onNewChat, onShowSettings, onBackToList, className = "" }) => {
    const { theme, toggleTheme, isDark } = useTheme();
    const { collapsed, toggle: toggleSidebar, width, showText } = useSidebarState();

    const sidebarStyle = {
        width: `${width}px`,
        transition: `width var(--transition-duration) ease`,
    };

    return (
        <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""} ${className}`} style={sidebarStyle}>
            {/* Top Section - Toggle and New Chat */}
            <div className={styles.topSection}>
                {/* Sidebar Toggle */}
                <Button
                    onClick={toggleSidebar}
                    variant="outline-secondary"
                    className={`${styles.button} ${styles.toggleButton}`}
                    title={collapsed ? "Expand Menu" : "Collapse Menu"}
                >
                    ☰ {showText && "Menu"}
                </Button>

                {/* Back to Conversations */}
                {onBackToList && (
                    <Button
                        onClick={onBackToList}
                        variant="outline-info"
                        className={styles.button}
                        title="Back to Conversations"
                    >
                        ← {showText && "Back"}
                    </Button>
                )}

                {/* New Chat Button */}
                <Button onClick={onNewChat} variant="outline-primary" className={styles.button} title="Start New Chat">
                    + {showText && "New Chat"}
                </Button>

                {/* Theme Toggle */}
                <Button
                    onClick={toggleTheme}
                    variant="outline-info"
                    className={styles.button}
                    title={`Switch to ${isDark ? "Light" : "Dark"} Theme`}
                >
                    {isDark ? <Sun /> : <Moon />}
                    {showText && ` ${isDark ? "Light" : "Dark"} Mode`}
                </Button>
            </div>

            {/* Middle Section - User Welcome */}
            {showText && user && (
                <div className={styles.userWelcome}>Welcome, {user.firstName || user.username || user.email}</div>
            )}

            {/* Bottom Section - Settings and Logout */}
            <div className={styles.bottomSection}>
                {/* Settings Button */}
                <Button
                    variant="outline-secondary"
                    onClick={onShowSettings}
                    title="API Settings"
                    className={styles.button}
                >
                    <Gear /> {showText && "API Settings"}
                </Button>

                {/* Logout Button */}
                <Button variant="outline-danger" onClick={() => logout()} title="Logout" className={styles.button}>
                    <BoxArrowRight /> {showText && "Logout"}
                </Button>
            </div>
        </div>
    );
};

export default Sidebar;
