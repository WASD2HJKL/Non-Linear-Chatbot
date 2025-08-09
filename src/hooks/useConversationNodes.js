import { useState, useEffect, useCallback } from "react";
import nodeService from "../services/nodeService";
import { usePrevious } from "./usePrevious";
import { getConversation, updateLastActiveNodeId } from "../client/operations/conversations";

/**
 * Custom hook for managing conversation nodes
 * @param {string} conversationId - Conversation UUID
 * @returns {Object} Hook state and methods
 */
export function useConversationNodes(conversationId) {
    const previousConversationId = usePrevious(conversationId);
    const [nodes, setNodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeNodeId, setActiveNodeId] = useState(null);

    // Load nodes when conversation changes
    useEffect(() => {
        const conversationChanged = previousConversationId !== conversationId;

        if (!conversationId) {
            setNodes([]);
            setActiveNodeId(null);
            return;
        }

        // Reset activeNodeId when switching to a different conversation
        if (conversationChanged && previousConversationId !== undefined) {
            setActiveNodeId(null);
        }

        loadNodes();
    }, [conversationId]);

    // Load nodes from the server
    const loadNodes = useCallback(async () => {
        if (!conversationId) return;

        setLoading(true);
        setError(null);

        try {
            const fetchedNodes = await nodeService.getNodes(conversationId);
            setNodes(fetchedNodes);

            // Set active node with persistence support
            const savedActiveNodeId = await loadConversationMeta();
            setActiveNodeId((currentActiveNodeId) => {
                // If we have a saved node and no current selection, try to use the saved one
                if (!currentActiveNodeId && savedActiveNodeId && fetchedNodes.length > 0) {
                    const savedNode = fetchedNodes.find((n) => n.id === savedActiveNodeId);
                    if (savedNode) {
                        return savedActiveNodeId;
                    }
                }

                // Fallback to latest node if no saved node or saved node doesn't exist
                if (!currentActiveNodeId && fetchedNodes.length > 0) {
                    const latestNode = fetchedNodes.reduce((latest, current) =>
                        new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest,
                    );
                    return latestNode.id;
                }

                return currentActiveNodeId;
            });
        } catch (err) {
            setError(err.message || "Failed to load conversation nodes");
            console.error("Error loading nodes:", err);
        } finally {
            setLoading(false);
        }
    }, [conversationId]);

    // Load conversation with lastActiveNodeId
    const loadConversationMeta = useCallback(async () => {
        if (!conversationId) return null;

        try {
            const conversation = await getConversation({ id: conversationId });
            return conversation.lastActiveNodeId;
        } catch (error) {
            console.error("Failed to load conversation meta:", error);
            return null;
        }
    }, [conversationId]);

    // Update lastActiveNodeId in database
    const updateLastActiveNode = useCallback(
        async (nodeId) => {
            if (!conversationId) return;

            try {
                await updateLastActiveNodeId({
                    conversationId,
                    lastActiveNodeId: nodeId,
                });
            } catch (error) {
                console.error("Failed to update last active node:", error);
                // Non-blocking error - don't throw
            }
        },
        [conversationId],
    );

    // Create a new node
    const createNode = useCallback(
        async (nodeData) => {
            if (!conversationId) {
                throw new Error("No conversation ID provided");
            }

            setLoading(true);
            setError(null);

            try {
                const newNode = await nodeService.createNode({
                    ...nodeData,
                    conversationId,
                });

                setNodes((prevNodes) => [...prevNodes, newNode]);
                setActiveNodeId(newNode.id);

                // Persist the new active node
                updateLastActiveNode(newNode.id);

                return newNode;
            } catch (err) {
                setError(err.message || "Failed to create node");
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [conversationId, updateLastActiveNode],
    );

    // Update node positions
    const updatePositions = useCallback(async (positionUpdates) => {
        if (!positionUpdates || positionUpdates.length === 0) {
            return;
        }

        try {
            const updatedNodes = await nodeService.updatePositions(positionUpdates);

            setNodes((prevNodes) =>
                prevNodes.map((node) => {
                    const update = updatedNodes.find((u) => u.id === node.id);
                    return update ? { ...node, ...update } : node;
                }),
            );

            return updatedNodes;
        } catch (err) {
            setError(err.message || "Failed to update positions");
            throw err;
        }
    }, []);

    // Update node widths
    const updateWidths = useCallback(async (widthUpdates) => {
        if (!widthUpdates || widthUpdates.length === 0) {
            return;
        }

        try {
            const updatedNodes = await nodeService.updateWidths(widthUpdates);

            setNodes((prevNodes) =>
                prevNodes.map((node) => {
                    const update = updatedNodes.find((u) => u.id === node.id);
                    return update ? { ...node, ...update } : node;
                }),
            );

            return updatedNodes;
        } catch (err) {
            setError(err.message || "Failed to update widths");
            throw err;
        }
    }, []);

    // Reconstruct messages for active node
    const reconstructMessages = useCallback(() => {
        if (!activeNodeId || nodes.length === 0) {
            // Return config messages for empty conversations
            return [
                {
                    role: "developer",
                    content:
                        "You are a helpful assistant. Your goal is to help the user with whatever queries they have.",
                },
                {
                    role: "assistant",
                    content: "Hello! How can I help you today?",
                },
            ];
        }

        return nodeService.reconstructMessages(activeNodeId, nodes);
    }, [activeNodeId, nodes]);

    // Get children of a node
    const getChildren = useCallback(
        (nodeId) => {
            return nodeService.getChildren(nodeId, nodes);
        },
        [nodes],
    );

    // Get root nodes
    const getRootNodes = useCallback(() => {
        return nodeService.getRootNodes(nodes);
    }, [nodes]);

    // Build tree structure
    const buildTree = useCallback(() => {
        return nodeService.buildTree(nodes);
    }, [nodes]);

    // Select a node as active with persistence and debouncing
    const selectNode = useCallback(
        (nodeId) => {
            // Prevent rapid successive calls
            setActiveNodeId((currentActiveNodeId) => {
                if (currentActiveNodeId === nodeId) {
                    return currentActiveNodeId; // No change needed
                }

                // Update database asynchronously
                updateLastActiveNode(nodeId);

                return nodeId;
            });
        },
        [updateLastActiveNode],
    );

    // Refresh nodes from server
    const refresh = useCallback(() => {
        loadNodes();
    }, [loadNodes]);

    return {
        // State
        nodes,
        loading,
        error,
        activeNodeId,

        // Actions
        createNode,
        updatePositions,
        updateWidths,
        selectNode,
        refresh,

        // Utilities
        reconstructMessages,
        getChildren,
        getRootNodes,
        buildTree,

        // Computed
        hasNodes: nodes.length > 0,
        activeNode: nodes.find((n) => n.id === activeNodeId) || null,
    };
}
