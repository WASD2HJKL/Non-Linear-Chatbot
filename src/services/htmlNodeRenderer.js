import { marked } from "marked";
import logger from "../utils/clientLogger";

function generateHTMLNodes(conversationTree, nodePositions, isFullTree, crossRefMap, _containerDimensions) {
    if (!conversationTree || Object.keys(conversationTree).length === 0) {
        return "";
    }

    let html = "";

    // Configure marked for safe HTML rendering
    marked.setOptions({
        breaks: true,
        gfm: true,
    });

    // Calculate z-index based on node size (smaller nodes get higher z-index)
    const calculateZIndex = (nodeContent) => {
        const totalLength = (nodeContent.question?.length || 0) + (nodeContent.answer?.length || 0);
        // Smaller content gets higher z-index (1000 - length/10, minimum 100)
        return Math.max(100, 1000 - Math.floor(totalLength / 10));
    };

    // Iterate through conversation tree nodes
    Object.values(conversationTree).forEach((branch) => {
        // Skip root node if it only has initial system/assistant messages
        const isRoot = branch.parentId === null;
        if (isRoot && branch.messages.length <= 2) {
            return;
        }

        // Extract question and answer content from the branch
        let nodeContent = { question: "", answer: "", summary: "" };

        if (!isRoot) {
            // For non-root nodes, get the last user-assistant pair
            const messages = branch.messages;
            if (messages.length >= 4) {
                // At least developer, assistant, user, assistant
                const lastUserIndex = messages.findLastIndex((m) => m.role === "user");
                if (lastUserIndex >= 0 && lastUserIndex + 1 < messages.length) {
                    nodeContent = {
                        question: messages[lastUserIndex].content,
                        answer: messages[lastUserIndex + 1].content,
                        summary: branch.summary || "",
                    };
                }
            }
        } else {
            // For root with content, show the assistant's initial message
            nodeContent = {
                question: "",
                answer: branch.messages[1]?.content || "",
                summary: "",
            };
        }

        // For truncated tree, use summary if available, otherwise truncate content
        if (!isFullTree) {
            if (nodeContent.summary) {
                // Use summary instead of truncated text
                nodeContent.displayQuestion = "";
                nodeContent.displayAnswer = nodeContent.summary;
                nodeContent.useSummary = true;
            } else {
                // Fallback to truncated text if no summary
                nodeContent.displayQuestion = truncateText(nodeContent.question, 100);
                nodeContent.displayAnswer = truncateText(nodeContent.answer, 150);
                nodeContent.useSummary = false;
            }
        } else {
            // Full tree always shows complete content
            nodeContent.displayQuestion = nodeContent.question;
            nodeContent.displayAnswer = nodeContent.answer;
            nodeContent.useSummary = false;
        }

        // Get node position - use ReactFlow positions directly
        let position = nodePositions[branch.id];
        if (!position) {
            // Default position if not found
            console.warn(`No position found for node ${branch.id}, using default (0,0)`);
            position = { x: 0, y: 0 };
        }

        // Positioning adjustments are now handled at the export level
        // No need to adjust here as positions are already adjusted

        // Debug: log the position being used
        logger.debug(
            `[HTML_RENDERER] Node ${branch.id.substring(0, 8)} position: ${JSON.stringify(position)}, isFullTree: ${isFullTree}, parentId: ${branch.parentId}`,
        );

        // Generate unique node ID for cross-referencing
        const nodeId = isFullTree ? `full-${branch.id}` : `truncated-${branch.id}`;
        const crossRefTargetId = crossRefMap[nodeId];

        // Calculate z-index for this node
        const zIndex = calculateZIndex(nodeContent);

        // Render markdown content based on display mode
        const displayQuestionHtml = nodeContent.displayQuestion ? marked.parse(nodeContent.displayQuestion) : "";
        const displayAnswerHtml = nodeContent.displayAnswer ? marked.parse(nodeContent.displayAnswer) : "";

        // Generate HTML div with absolute positioning and z-index
        html += `
            <div id="${nodeId}" class="conversation-node" style="
                position: absolute;
                left: ${position.x}px;
                top: ${position.y}px;
                width: ${branch.width || 250}px;
                padding: 10px;
                border-radius: 8px;
                background: white;
                border: 1px solid #ccc;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                font-size: 14px;
                overflow: hidden;
                z-index: ${zIndex};
                transition: z-index 0.2s ease;
            ">
                ${
                    nodeContent.useSummary
                        ? `
                    <!-- Summary view: show only summary -->
                    <div style="
                        padding: 8px;
                        background: #f9f9f9;
                        border-radius: 6px;
                        border: 1px solid #e0e0e0;
                        margin-bottom: 8px;
                    ">
                        <strong>Summary:</strong>
                        <div style="margin: 0; font-size: 12px;">${displayAnswerHtml}</div>
                    </div>
                `
                        : `
                    <!-- Normal view: show user and assistant messages -->
                    ${
                        nodeContent.displayQuestion
                            ? `
                        <div style="
                            background: #f0f0f0;
                            padding: 8px;
                            border-radius: 6px;
                            margin-bottom: 8px;
                        ">
                            <strong>User:</strong>
                            <div style="margin: 0; font-size: 12px;">${displayQuestionHtml}</div>
                        </div>
                    `
                            : ""
                    }
                    
                    <div style="
                        padding: 8px;
                        background: #e8f4fd;
                        border-radius: 6px;
                        margin-bottom: 8px;
                    ">
                        <strong>Assistant:</strong>
                        <div style="margin: 0; font-size: 12px;">${displayAnswerHtml}</div>
                    </div>
                `
                }

                ${
                    crossRefTargetId
                        ? `
                    <button class="nav-button" 
                            data-target="${crossRefTargetId}"
                            style="
                                width: 100%;
                                padding: 4px 8px;
                                font-size: 10px;
                                border: 1px solid #0096FF;
                                background: #f8f9fa;
                                color: #0096FF;
                                border-radius: 4px;
                                cursor: pointer;
                            ">
                        ${isFullTree ? "Back to Overview" : "View Full Details"}
                    </button>
                `
                        : ""
                }
            </div>
        `;
    });

    return html;
}

function truncateText(text, maxLength) {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

export default {
    generateHTMLNodes,
};
