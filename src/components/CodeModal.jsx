import React, { useState } from "react";
import { Modal, Button, Alert } from "react-bootstrap";
import styles from "./CodeModal.module.css";

/**
 * CodeModal Component
 *
 * Displays code blocks in a full-screen modal with proper scrolling
 * and copy-to-clipboard functionality.
 */
function CodeModal({ show, onHide, codeBlocks, title }) {
    const [copyStatus, setCopyStatus] = useState({ show: false, message: "", variant: "success" });

    /**
     * Copy text to clipboard with fallback for older browsers
     */
    const copyToClipboard = async (text) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                // Modern clipboard API
                await navigator.clipboard.writeText(text);
                showCopyFeedback("Code copied to clipboard!", "success");
            } else {
                // Fallback for older browsers
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                textArea.style.top = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();

                if (document.execCommand("copy")) {
                    showCopyFeedback("Code copied to clipboard!", "success");
                } else {
                    throw new Error("Copy command failed");
                }

                document.body.removeChild(textArea);
            }
        } catch (error) {
            console.error("Failed to copy code:", error);
            showCopyFeedback("Failed to copy code. Please select and copy manually.", "danger");
        }
    };

    /**
     * Show copy feedback message
     */
    const showCopyFeedback = (message, variant) => {
        setCopyStatus({ show: true, message, variant });

        // Hide feedback after 3 seconds
        setTimeout(() => {
            setCopyStatus({ show: false, message: "", variant: "success" });
        }, 3000);
    };

    /**
     * Copy all code blocks as a single text
     */
    const copyAllCode = () => {
        if (!codeBlocks || codeBlocks.length === 0) return;

        const allCode = codeBlocks
            .map((block) => {
                const header = block.displayName ? `// ${block.displayName}\n` : "";
                return header + block.content;
            })
            .join("\n\n---\n\n");

        copyToClipboard(allCode);
    };

    if (!codeBlocks || codeBlocks.length === 0) {
        return null;
    }

    return (
        <Modal show={show} onHide={onHide} size="lg" centered className={styles.codeModal}>
            <Modal.Header closeButton>
                <Modal.Title>{title || "Code Blocks"}</Modal.Title>
            </Modal.Header>

            <Modal.Body className={styles.modalBody}>
                {/* Copy feedback alert */}
                {copyStatus.show && (
                    <Alert
                        variant={copyStatus.variant}
                        className={styles.copyAlert}
                        dismissible
                        onClose={() => setCopyStatus({ show: false, message: "", variant: "success" })}
                    >
                        {copyStatus.message}
                    </Alert>
                )}

                {/* Code blocks display */}
                <div className={styles.codeContainer}>
                    {codeBlocks.map((block, index) => (
                        <div key={block.id || index} className={styles.codeBlock}>
                            <div className={styles.codeHeader}>
                                <span className={styles.codeTitle}>
                                    {block.displayName || `Code Block ${index + 1}`}
                                </span>
                                <Button
                                    size="sm"
                                    variant="outline-primary"
                                    onClick={() => copyToClipboard(block.content, block.id)}
                                    className={styles.copyButton}
                                >
                                    Copy
                                </Button>
                            </div>

                            <pre className={styles.codeContent}>
                                <code className={`language-${block.language}`}>{block.content}</code>
                            </pre>
                        </div>
                    ))}
                </div>
            </Modal.Body>

            <Modal.Footer>
                {codeBlocks.length > 1 && (
                    <Button variant="primary" onClick={copyAllCode} className={styles.copyAllButton}>
                        Copy All Code
                    </Button>
                )}
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default CodeModal;
