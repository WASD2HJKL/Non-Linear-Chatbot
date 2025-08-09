import React from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { LAYOUT_CONSTANTS } from "../../constants/layoutConstants";
import { useTheme } from "../../hooks/useTheme.js";
import styles from "./ResizablePanelLayout.module.css";

/**
 * Resizable panel layout component
 * Wraps react-resizable-panels with theme-aware styling
 *
 * @param {object} props - Component props
 * @param {React.ReactNode} props.leftPanel - Left panel content
 * @param {React.ReactNode} props.rightPanel - Right panel content
 * @param {string} props.leftTitle - Title for left panel
 * @param {string} props.rightTitle - Title for right panel
 * @param {number} props.leftDefaultSize - Default size for left panel (percentage)
 * @param {number} props.rightDefaultSize - Default size for right panel (percentage)
 * @param {number} props.minSize - Minimum size for panels (percentage)
 * @param {string} props.autoSaveId - ID for auto-saving panel sizes
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} Resizable panel layout
 */
const ResizablePanelLayout = ({
    leftPanel,
    rightPanel,
    leftTitle = "Left Panel",
    rightTitle = "Right Panel",
    leftDefaultSize = LAYOUT_CONSTANTS.PANEL_DEFAULT_SIZE,
    rightDefaultSize = LAYOUT_CONSTANTS.PANEL_DEFAULT_SIZE,
    minSize = LAYOUT_CONSTANTS.PANEL_MIN_SIZE,
    autoSaveId = "main-panels",
    className = "",
}) => {
    const { theme } = useTheme();

    const resizeHandleStyle = {
        width: `${LAYOUT_CONSTANTS.RESIZE_HANDLE_WIDTH}px`,
        backgroundColor: "var(--resize-handle-color)",
        transition: `background-color var(--transition-duration) ease`,
    };

    return (
        <div className={`${styles.container} ${className}`} data-theme={theme}>
            <PanelGroup direction="horizontal" autoSaveId={autoSaveId} className={styles.panelGroup}>
                {/* Left Panel */}
                <Panel defaultSize={leftDefaultSize} minSize={minSize} className={styles.panel}>
                    <div className={styles.panelContent}>
                        {leftTitle && <h5 className={styles.panelTitle}>{leftTitle}</h5>}
                        <div className={styles.panelBody}>{leftPanel}</div>
                    </div>
                </Panel>

                {/* Resize Handle */}
                <PanelResizeHandle className={styles.resizeHandle} style={resizeHandleStyle} />

                {/* Right Panel */}
                <Panel defaultSize={rightDefaultSize} minSize={minSize} className={styles.panel}>
                    <div className={styles.panelContent}>
                        {rightTitle && <h5 className={styles.panelTitle}>{rightTitle}</h5>}
                        <div className={styles.panelBody}>{rightPanel}</div>
                    </div>
                </Panel>
            </PanelGroup>
        </div>
    );
};

export default ResizablePanelLayout;
