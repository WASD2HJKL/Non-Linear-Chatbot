import configService from "../services/configService";

/**
 * Reconstructs messages array from node path for TextApp display
 * @param {string[]} path - Array of node IDs from root to current
 * @param {Object[]} allNodes - All nodes in the conversation
 * @returns {Object[]} Array of messages with developer/assistant/user roles
 */
export function reconstructMessagesFromPath(path, allNodes) {
    if (!path || path.length === 0) {
        return getConfigMessages();
    }

    const messages = [...getConfigMessages()];

    // Create a map for quick node lookup
    const nodeMap = new Map();
    allNodes.forEach((node) => {
        nodeMap.set(node.id, node);
    });

    // Follow the path and add user/assistant message pairs
    for (const nodeId of path) {
        const node = nodeMap.get(nodeId);
        if (node) {
            messages.push({
                role: "user",
                content: node.userMessage,
            });
            messages.push({
                role: "assistant",
                content: node.assistantMessage,
            });
        }
    }

    return messages;
}

/**
 * Get predefined messages from configuration
 * @returns {Object[]} Array containing developer and initial assistant messages
 */
export function getConfigMessages() {
    const chatConfig = configService.getChatConfig();
    return [
        {
            role: "developer",
            content: chatConfig.prompt || "You are a helpful assistant.",
        },
        {
            role: "assistant",
            content: chatConfig.initialMessage || "Hello! How can I help you today?",
        },
    ];
}

/**
 * Convert existing localStorage branch structure to node format
 * @param {Object} conversationTree - Current localStorage tree structure
 * @param {string} conversationId - Target conversation ID
 * @returns {Object[]} Array of nodes ready for database insertion
 */
export function convertBranchesToNodes(conversationTree, conversationId) {
    const nodes = [];
    const processedBranches = new Set();

    if (!conversationTree || typeof conversationTree !== "object") {
        return nodes;
    }

    // Process each branch in the tree
    Object.keys(conversationTree).forEach((branchId) => {
        if (processedBranches.has(branchId) || branchId === "root") {
            return;
        }

        const branch = conversationTree[branchId];
        if (!branch || !branch.messages || branch.messages.length < 4) {
            return; // Skip invalid branches
        }

        try {
            // Extract user and assistant messages (skip messages[0] and messages[1])
            const userMessage = branch.messages[2]?.content || "";
            const assistantMessage = branch.messages[3]?.content || "";

            if (userMessage && assistantMessage) {
                const node = {
                    conversationId,
                    parentId: branch.parentId === "root" ? null : branch.parentId,
                    userMessage,
                    assistantMessage,
                    x: Math.random() * 400, // Random position for now
                    y: Math.random() * 300,
                };

                nodes.push(node);
                processedBranches.add(branchId);
            }
        } catch (error) {
            console.error(`Error converting branch ${branchId}:`, error);
        }
    });

    return nodes;
}
