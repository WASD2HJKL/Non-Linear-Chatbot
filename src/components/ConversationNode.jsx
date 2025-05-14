import React, { memo } from "react";
import { Handle, Position } from "reactflow";

function ConversationNode({ data, isConnectable }) {
    const { question, answer, isSelected } = data;

    // Node styling
    const nodeStyle = {
        padding: "10px",
        borderRadius: "8px",
        width: "250px",
        background: isSelected ? "#d2f5ff" : "white",
        border: isSelected ? "2px solid #0096FF" : "1px solid #ccc",
        boxShadow: isSelected
            ? "0 0 10px rgba(0, 150, 255, 0.5)"
            : "0 4px 6px rgba(0, 0, 0, 0.1)",
        cursor: "pointer",
        transition: "all 0.3s ease",
        fontSize: "14px",
        overflow: "hidden",
    };

    // Truncate text longer than a certain length
    const truncateText = (text, maxLength = 50) => {
        if (!text) return "";
        return text.length > maxLength
            ? text.substring(0, maxLength) + "..."
            : text;
    };

    return (
        <div style={nodeStyle}>
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
            />

            <div style={{ textAlign: "left" }}>
                {question && (
                    <div
                        style={{
                            background: "#f0f0f0",
                            padding: "8px",
                            borderRadius: "6px",
                            marginBottom: "8px",
                        }}>
                        <strong>User:</strong>
                        <p style={{ margin: 0, fontSize: "12px" }}>
                            {truncateText(question, 100)}
                        </p>
                    </div>
                )}

                <div
                    style={{
                        padding: "8px",
                        background: "#e8f4fd",
                        borderRadius: "6px",
                    }}>
                    <strong>Assistant:</strong>
                    <p style={{ margin: 0, fontSize: "12px" }}>
                        {truncateText(answer, 150)}
                    </p>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
            />
        </div>
    );
}

export default memo(ConversationNode);
