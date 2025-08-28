import {
    createNode,
    updateNodePositions,
    updateNodeWidth,
    deleteNode,
    getConversationNodes,
} from "../client/operations/nodes";
import { reconstructMessagesFromPath } from "../utils/messageReconstruction";

/**
 * Service for managing conversation nodes and tree operations
 */
class NodeService {
    constructor() {
        this.nodeCache = new Map();
        this.conversationCache = new Map();
    }

    /**
     * Get all nodes for a conversation
     * @param {string} conversationId - Conversation UUID
     * @returns {Promise<Object[]>} Array of nodes
     */
    async getNodes(conversationId) {
        try {
            const nodes = await getConversationNodes({ conversationId });
            this.conversationCache.set(conversationId, nodes);
            return nodes;
        } catch (error) {
            console.error("Error fetching nodes:", error);
            throw error;
        }
    }

    /**
     * Create a new node with user/assistant message pair
     * @param {Object} nodeData - Node creation parameters
     * @returns {Promise<Object>} Created node
     */
    async createNode(nodeData) {
        try {
            const node = await createNode(nodeData);

            // Update cache
            const conversationNodes = this.conversationCache.get(nodeData.conversationId) || [];
            conversationNodes.push(node);
            this.conversationCache.set(nodeData.conversationId, conversationNodes);

            return node;
        } catch (error) {
            console.error("Error creating node:", error);
            throw error;
        }
    }

    /**
     * Update node positions after drag operations
     * @param {Object[]} updates - Array of position updates
     * @returns {Promise<Object[]>} Updated nodes
     */
    async updatePositions(updates) {
        try {
            const updatedNodes = await updateNodePositions({ updates });

            // Update cache
            updatedNodes.forEach((node) => {
                const conversationNodes = this.conversationCache.get(node.conversationId) || [];
                const index = conversationNodes.findIndex((n) => n.id === node.id);
                if (index !== -1) {
                    conversationNodes[index] = node;
                }
            });

            return updatedNodes;
        } catch (error) {
            console.error("Error updating positions:", error);
            throw error;
        }
    }

    /**
     * Update node widths after resize operations
     * @param {Object[]} updates - Array of width updates
     * @returns {Promise<Object[]>} Updated nodes
     */
    async updateWidths(updates) {
        try {
            const updatedNodes = await updateNodeWidth({ updates });

            // Update cache
            updatedNodes.forEach((node) => {
                const conversationNodes = this.conversationCache.get(node.conversationId) || [];
                const index = conversationNodes.findIndex((n) => n.id === node.id);
                if (index !== -1) {
                    conversationNodes[index] = node;
                }
            });

            return updatedNodes;
        } catch (error) {
            console.error("Error updating widths:", error);
            throw error;
        }
    }

    /**
     * Delete a node and all its descendants
     * @param {string} nodeId - Node ID to delete
     * @returns {Promise<void>}
     */
    async deleteNode(nodeId) {
        try {
            await deleteNode({ nodeId });

            // Remove from cache if present
            for (const [conversationId, nodes] of this.conversationCache) {
                const updatedNodes = nodes.filter((node) => node.id !== nodeId);
                if (updatedNodes.length !== nodes.length) {
                    this.conversationCache.set(conversationId, updatedNodes);
                }
            }
        } catch (error) {
            console.error("Error deleting node:", error);
            throw error;
        }
    }

    /**
     * Reconstruct messages for a specific node
     * @param {string} nodeId - Target node ID
     * @param {Object[]} allNodes - All nodes in conversation
     * @returns {Object[]} Reconstructed messages array
     */
    reconstructMessages(nodeId, allNodes) {
        if (!nodeId || !allNodes) {
            return [];
        }

        const targetNode = allNodes.find((n) => n.id === nodeId);
        if (!targetNode) {
            return [];
        }

        return reconstructMessagesFromPath(targetNode.path, allNodes);
    }

    /**
     * Get children of a specific node
     * @param {string} nodeId - Parent node ID
     * @param {Object[]} allNodes - All nodes in conversation
     * @returns {Object[]} Child nodes
     */
    getChildren(nodeId, allNodes) {
        return allNodes.filter((node) => node.parentId === nodeId);
    }

    /**
     * Get root nodes (nodes with no parent)
     * @param {Object[]} allNodes - All nodes in conversation
     * @returns {Object[]} Root nodes
     */
    getRootNodes(allNodes) {
        return allNodes.filter((node) => node.parentId === null);
    }

    /**
     * Build tree structure from flat node array
     * @param {Object[]} nodes - Flat array of nodes
     * @returns {Object} Tree structure for visualization
     */
    buildTree(nodes) {
        const tree = {};
        const nodeMap = new Map();

        // Create node map
        nodes.forEach((node) => {
            nodeMap.set(node.id, {
                ...node,
                children: [],
            });
        });

        // Build parent-child relationships
        nodes.forEach((node) => {
            if (node.parentId) {
                const parent = nodeMap.get(node.parentId);
                if (parent) {
                    parent.children.push(node.id);
                }
            } else {
                // Root node
                tree[node.id] = nodeMap.get(node.id);
            }
        });

        return tree;
    }

    /**
     * Clear cache for a conversation
     * @param {string} conversationId - Conversation UUID
     */
    clearCache(conversationId) {
        this.conversationCache.delete(conversationId);
    }

    /**
     * Clear all caches
     */
    clearAllCaches() {
        this.nodeCache.clear();
        this.conversationCache.clear();
    }
}

export default new NodeService();
