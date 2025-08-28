import React, { memo, useState, useEffect } from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import { Button } from "react-bootstrap";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./ConversationNode.module.css";
import CodeModal from "./CodeModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { detectCodeBlocks, extractCodeContent } from "../utils/codeBlockDetector";

function ConversationNode({ data, isConnectable }) {
    const {
        question,
        answer,
        summary,
        isSelected,
        onClick,
        onWidthChange,
        onExpandedChange,
        onDelete,
        width = 250,
        expanded: initialExpanded = false,
        nodeId,
        measureRef,
    } = data;
    const [expanded, setExpanded] = useState(initialExpanded);
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [codeData, setCodeData] = useState({ hasCodeBlocks: false, codeBlocks: [] });

    // Detect code blocks when content changes
    useEffect(() => {
        const detectCode = () => {
            try {
                // Combine question and answer for code detection
                const allContent = [question, answer].filter(Boolean).join("\n\n");

                if (!allContent) {
                    setCodeData({ hasCodeBlocks: false, codeBlocks: [] });
                    return;
                }

                const detection = detectCodeBlocks(allContent);
                const formattedBlocks = extractCodeContent(detection.codeBlocks);

                setCodeData({
                    hasCodeBlocks: detection.hasCodeBlocks,
                    codeBlocks: formattedBlocks,
                });
            } catch (error) {
                console.error("Error detecting code blocks:", error);
                setCodeData({ hasCodeBlocks: false, codeBlocks: [] });
            }
        };

        detectCode();
    }, [question, answer]);

    // Node styling with dynamic width
    const nodeStyle = {
        padding: "10px",
        borderRadius: "8px",
        width: `${width}px`,
        background: isSelected ? "var(--node-background-selected)" : "var(--node-background)",
        border: isSelected ? "2px solid var(--node-border-selected)" : "1px solid var(--node-border)",
        boxShadow: isSelected ? "0 0 10px var(--node-shadow-selected)" : "0 4px 6px var(--node-shadow)",
        cursor: "pointer",
        transition: "all 0.3s ease",
        fontSize: "14px",
        overflowY: "hidden",
        overflowX: "visible",
        position: "relative",
    };

    // Truncate text longer than a certain length
    const truncateText = (text, maxLength = 50) => {
        if (!text) return "";
        return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
    };

    // Handle clicks on the node
    const handleNodeClick = (e) => {
        e.stopPropagation();
        if (onClick) onClick();
    };

    // Toggle expanded state for the node
    const toggleExpand = async (e) => {
        e.stopPropagation();
        const newExpanded = !expanded;
        setExpanded(newExpanded);

        try {
            if (onExpandedChange) {
                await onExpandedChange(nodeId, newExpanded);
            }
        } catch (error) {
            console.error("Failed to update expanded state:", error);
            // Revert local state on error
            setExpanded(expanded);
        }
    };

    // Open code modal
    const handleViewCode = (e) => {
        e.stopPropagation();
        setShowCodeModal(true);
    };

    // Handle delete button click
    const handleDelete = (e) => {
        e.stopPropagation();
        setShowDeleteModal(true);
    };

    // Handle delete confirmation
    const handleConfirmDelete = async () => {
        setShowDeleteModal(false);
        if (onDelete) {
            try {
                await onDelete(nodeId);
            } catch (error) {
                console.error("Failed to delete node:", error);
                alert("Failed to delete node. Please try again.");
            }
        }
    };

    // Handle node resize end (only update on resize completion)
    const handleResizeEnd = (event, params) => {
        if (onWidthChange && params.width) {
            onWidthChange(params.width);
        }
    };

    return (
        <div ref={measureRef ? measureRef(nodeId) : null} style={nodeStyle} onClick={handleNodeClick}>
            <NodeResizer minWidth={150} maxWidth={800} onResizeEnd={handleResizeEnd} isVisible={isSelected} />
            {/* Drag handle */}
            <div
                className="drag-handle"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "14px",
                    background: isSelected ? "var(--node-drag-handle-bg-selected)" : "var(--node-drag-handle-bg)",
                    borderTopLeftRadius: "8px",
                    borderTopRightRadius: "8px",
                    cursor: "move",
                    zIndex: 1,
                }}
            />

            <Handle type="target" position={Position.Left} isConnectable={isConnectable} />

            <div style={{ textAlign: "left", marginTop: "10px" }}>
                {expanded ? (
                    // Expanded view: show both user and assistant messages
                    <>
                        {question && (
                            <div
                                style={{
                                    background: "var(--node-user-message-bg)",
                                    padding: "8px",
                                    borderRadius: "6px",
                                    marginBottom: "8px",
                                }}
                            >
                                <strong>User:</strong>
                                <div
                                    style={{ margin: 0, fontSize: "12px" }}
                                    className={`${styles.markdownContent}${expanded ? ` ${styles.expanded}` : ""} ${styles.userMessage}`}
                                >
                                    <Markdown remarkPlugins={[remarkGfm]}>{question}</Markdown>
                                </div>
                            </div>
                        )}

                        <div
                            style={{
                                padding: "8px",
                                background: "var(--node-assistant-message-bg)",
                                borderRadius: "6px",
                            }}
                        >
                            <strong>Assistant:</strong>
                            <div
                                style={{ margin: 0, fontSize: "12px" }}
                                className={`${styles.markdownContent}${expanded ? ` ${styles.expanded}` : ""} ${styles.assistantMessage}`}
                            >
                                <Markdown remarkPlugins={[remarkGfm]}>{answer}</Markdown>
                            </div>
                        </div>
                    </>
                ) : (
                    // Collapsed view: show only summary
                    <div
                        style={{
                            padding: "8px",
                            background: "var(--node-summary-message-bg)",
                            borderRadius: "6px",
                            border: "1px solid var(--node-message-border)",
                        }}
                    >
                        <strong>Summary:</strong>
                        <div
                            style={{ margin: 0, fontSize: "12px" }}
                            className={`${styles.markdownContent} ${styles.summaryMessage}`}
                        >
                            <Markdown remarkPlugins={[remarkGfm]}>{summary || truncateText(answer, 150)}</Markdown>
                        </div>
                    </div>
                )}

                {(question || answer) && (
                    <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
                        <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={toggleExpand}
                            style={{
                                flex: 1,
                                fontSize: "10px",
                            }}
                        >
                            {expanded ? "Collapse" : "Expand"}
                        </Button>
                        {onDelete && (
                            <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={handleDelete}
                                style={{
                                    fontSize: "10px",
                                    width: "60px",
                                }}
                            >
                                Delete
                            </Button>
                        )}
                    </div>
                )}

                {codeData.hasCodeBlocks && (
                    <button
                        className={styles.viewCodeButton}
                        onClick={handleViewCode}
                        title="View code blocks in full screen"
                    >
                        View Code ({codeData.codeBlocks.length})
                    </button>
                )}
            </div>

            <Handle type="source" position={Position.Right} isConnectable={isConnectable} />

            {/* Code Modal */}
            <CodeModal
                show={showCodeModal}
                onHide={() => setShowCodeModal(false)}
                codeBlocks={codeData.codeBlocks}
                title={`Code from ${question ? "User and " : ""}Assistant Message`}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                show={showDeleteModal}
                onHide={() => setShowDeleteModal(false)}
                onConfirm={handleConfirmDelete}
                nodeSummary={summary || truncateText(answer, 100)}
            />
        </div>
    );
}

export default memo(ConversationNode);
