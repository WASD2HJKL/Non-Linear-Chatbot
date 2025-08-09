import { useCallback, useEffect, useState, useRef } from "react";
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "react-bootstrap";
import ConversationNode from "./ConversationNode";
import useTreeLayout from "../hook/useTreeLayout";
import { useMeasureNodeDimensions } from "../hooks/useMeasureNodeDimensions.js";
import ExportButton from "./ExportButton";
import ExportModal from "./ExportModal";
import { useAuth } from "wasp/client/auth";
import { updateNodeExpanded } from "wasp/client/operations";
import exportConversation from "../services/conversationExporter";

// Custom node types
const nodeTypes = {
    conversationNode: ConversationNode,
};

function ConversationCanvas({
    nodes: conversationNodes,
    activeNodeId,
    onNodeSelect,
    onNodePositionUpdate,
    onNodeWidthUpdate,
    onRefresh,
}) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [showExportModal, setShowExportModal] = useState(false);
    const [isLayouting, setIsLayouting] = useState(false);
    const { calculateTreeLayout } = useTreeLayout();
    const { data: user } = useAuth();
    const reactFlowRef = useRef(null);

    // Get node IDs for dimension measurement
    const nodeIds = conversationNodes ? conversationNodes.map((node) => node.id) : [];
    const { dimensions, measureRef, isReady } = useMeasureNodeDimensions(nodeIds);

    // Use refs to avoid recreating nodes on every callback change
    const onNodeSelectRef = useRef(onNodeSelect);
    const onNodePositionUpdateRef = useRef(onNodePositionUpdate);
    const onNodeWidthUpdateRef = useRef(onNodeWidthUpdate);

    // Update refs when callbacks change
    useEffect(() => {
        onNodeSelectRef.current = onNodeSelect;
        onNodePositionUpdateRef.current = onNodePositionUpdate;
        onNodeWidthUpdateRef.current = onNodeWidthUpdate;
    }, [onNodeSelect, onNodePositionUpdate, onNodeWidthUpdate]);

    // Convert nodes to ReactFlow format and handle positioning
    useEffect(() => {
        try {
            if (!conversationNodes || conversationNodes.length === 0) {
                setNodes([]);
                setEdges([]);
                return;
            }

            const reactFlowNodes = conversationNodes.map((node) => ({
                id: node.id,
                type: "conversationNode",
                position: { x: node.x || 50, y: node.y || 50 },
                data: {
                    nodeId: node.id,
                    question: node.userMessage || "",
                    answer: node.assistantMessage || "",
                    summary: node.summary || null,
                    width: node.width || 250,
                    expanded: node.expanded || false,
                    isSelected: node.id === activeNodeId,
                    measureRef: measureRef,
                    onClick: () => onNodeSelectRef.current && onNodeSelectRef.current(node.id),
                    onWidthChange: (newWidth) => {
                        // Update ReactFlow node data immediately for responsiveness
                        setNodes((currentNodes) =>
                            currentNodes.map((reactFlowNode) =>
                                reactFlowNode.id === node.id
                                    ? {
                                          ...reactFlowNode,
                                          data: { ...reactFlowNode.data, width: newWidth },
                                      }
                                    : reactFlowNode,
                            ),
                        );

                        // Then update the database
                        if (onNodeWidthUpdateRef.current) {
                            onNodeWidthUpdateRef.current([
                                {
                                    nodeId: node.id,
                                    width: newWidth,
                                },
                            ]);
                        }
                    },
                    onExpandedChange: async (nodeId, expanded) => {
                        // Update ReactFlow node data immediately for responsiveness
                        setNodes((currentNodes) =>
                            currentNodes.map((reactFlowNode) =>
                                reactFlowNode.id === nodeId
                                    ? {
                                          ...reactFlowNode,
                                          data: { ...reactFlowNode.data, expanded: expanded },
                                      }
                                    : reactFlowNode,
                            ),
                        );

                        // Then update the database
                        try {
                            await updateNodeExpanded({ nodeId, expanded });
                        } catch (error) {
                            console.error("Failed to update node expanded state:", error);
                            // Revert the local state on error
                            setNodes((currentNodes) =>
                                currentNodes.map((reactFlowNode) =>
                                    reactFlowNode.id === nodeId
                                        ? {
                                              ...reactFlowNode,
                                              data: { ...reactFlowNode.data, expanded: !expanded },
                                          }
                                        : reactFlowNode,
                                ),
                            );
                            throw error;
                        }
                    },
                },
            }));

            const reactFlowEdges = conversationNodes
                .filter((node) => node.parentId)
                .map((node) => ({
                    id: `${node.parentId}-${node.id}`,
                    source: node.parentId,
                    target: node.id,
                    markerEnd: { type: MarkerType.ArrowClosed },
                    style: { strokeWidth: 2 },
                }));

            setNodes(reactFlowNodes);
            setEdges(reactFlowEdges);
        } catch (error) {
            console.error("Error updating conversation canvas:", error);
            setNodes([]);
            setEdges([]);
        }
    }, [conversationNodes, activeNodeId]);

    // Handle node click
    const onNodeClick = useCallback((event, node) => {
        if (node.data.onClick) {
            node.data.onClick();
        }
    }, []);

    // Track node position changes when dragging ends
    const onNodeDragStop = useCallback((event, node) => {
        if (onNodePositionUpdateRef.current) {
            // Send batch update with single node
            onNodePositionUpdateRef.current([
                {
                    nodeId: node.id,
                    x: node.position.x,
                    y: node.position.y,
                },
            ]);
        }
    }, []);

    // Layout the graph automatically using context-aware layout service
    const handleAutoLayout = useCallback(async () => {
        if (!conversationNodes || conversationNodes.length === 0) return;

        setIsLayouting(true);
        try {
            // Wait for dimensions to be ready if still measuring
            if (!isReady) {
                console.log("Waiting for node dimensions to be measured...");
                // Give a short delay for measurements to complete
                await new Promise((resolve) => setTimeout(resolve, 100));
            }

            // Calculate layout using enhanced tree layout service
            const positions = await calculateTreeLayout(conversationNodes, dimensions, {
                direction: "LR", // Left to right layout (horizontal growth)
                density: "NORMAL",
            });

            // Convert positions to update format
            const updates = Object.entries(positions).map(([nodeId, pos]) => ({
                nodeId,
                x: pos.x,
                y: pos.y,
            }));

            if (updates.length > 0 && onNodePositionUpdateRef.current) {
                await onNodePositionUpdateRef.current(updates);
            }
        } catch (error) {
            console.error("Auto layout failed:", error);
            // Fallback to simple layout if advanced layout fails
            try {
                const updates = conversationNodes.map((node, index) => {
                    const col = index % 3;
                    const row = Math.floor(index / 3);
                    return {
                        nodeId: node.id,
                        x: col * 350,
                        y: row * 200,
                    };
                });

                if (onNodePositionUpdateRef.current) {
                    onNodePositionUpdateRef.current(updates);
                }
            } catch (fallbackError) {
                console.error("Even fallback layout failed:", fallbackError);
            }
        } finally {
            setIsLayouting(false);
        }
    }, [conversationNodes, dimensions, isReady, calculateTreeLayout]);

    // Handle expand all nodes
    const handleExpandAll = useCallback(async () => {
        // Filter to only visible nodes
        const visibleNodes = conversationNodes.filter((node) => node.visible !== false);
        const nodesToExpand = visibleNodes.filter((node) => !node.expanded);

        if (nodesToExpand.length === 0) return;

        // Update ReactFlow state immediately (optimistic)
        setNodes((currentNodes) =>
            currentNodes.map((reactFlowNode) => {
                const shouldExpand = nodesToExpand.some((n) => n.id === reactFlowNode.id);
                return shouldExpand
                    ? { ...reactFlowNode, data: { ...reactFlowNode.data, expanded: true } }
                    : reactFlowNode;
            }),
        );

        try {
            // Batch database updates
            await Promise.all(nodesToExpand.map((node) => updateNodeExpanded({ nodeId: node.id, expanded: true })));

            // Refresh nodes from server to synchronize data
            if (onRefresh) {
                onRefresh();
            }

            // Trigger auto layout after successful expansion and data refresh
            await handleAutoLayout();
        } catch (error) {
            console.error("Failed to expand all nodes:", error);
            // Revert ReactFlow state on error
            setNodes((currentNodes) =>
                currentNodes.map((reactFlowNode) => {
                    const shouldRevert = nodesToExpand.some((n) => n.id === reactFlowNode.id);
                    return shouldRevert
                        ? { ...reactFlowNode, data: { ...reactFlowNode.data, expanded: false } }
                        : reactFlowNode;
                }),
            );
        }
    }, [conversationNodes, updateNodeExpanded, handleAutoLayout, setNodes]);

    // Handle collapse all nodes
    const handleCollapseAll = useCallback(async () => {
        // Filter to only visible nodes
        const visibleNodes = conversationNodes.filter((node) => node.visible !== false);
        const nodesToCollapse = visibleNodes.filter((node) => node.expanded);

        if (nodesToCollapse.length === 0) return;

        // Update ReactFlow state immediately (optimistic)
        setNodes((currentNodes) =>
            currentNodes.map((reactFlowNode) => {
                const shouldCollapse = nodesToCollapse.some((n) => n.id === reactFlowNode.id);
                return shouldCollapse
                    ? { ...reactFlowNode, data: { ...reactFlowNode.data, expanded: false } }
                    : reactFlowNode;
            }),
        );

        try {
            // Batch database updates
            await Promise.all(nodesToCollapse.map((node) => updateNodeExpanded({ nodeId: node.id, expanded: false })));

            // Refresh nodes from server to synchronize data
            if (onRefresh) {
                onRefresh();
            }

            // Trigger auto layout after successful collapse and data refresh
            await handleAutoLayout();
        } catch (error) {
            console.error("Failed to collapse all nodes:", error);
            // Revert ReactFlow state on error
            setNodes((currentNodes) =>
                currentNodes.map((reactFlowNode) => {
                    const shouldRevert = nodesToCollapse.some((n) => n.id === reactFlowNode.id);
                    return shouldRevert
                        ? { ...reactFlowNode, data: { ...reactFlowNode.data, expanded: true } }
                        : reactFlowNode;
                }),
            );
        }
    }, [conversationNodes, updateNodeExpanded, handleAutoLayout, setNodes]);

    // Handle export button click
    const handleExportClick = useCallback(() => {
        setShowExportModal(true);
    }, []);

    // Handle export modal close
    const handleExportModalClose = useCallback(() => {
        setShowExportModal(false);
    }, []);

    // Handle actual export from modal
    const handleExport = useCallback(
        async (settings) => {
            try {
                // Only filter based on visible field, not content (root nodes may have empty messages)
                const visibleNodes = conversationNodes.filter((node) => node.visible !== false);

                const nodePositions = {};
                visibleNodes.forEach((node) => {
                    nodePositions[node.id] = { x: node.x || 0, y: node.y || 0 };
                });

                // Debug: log the data being passed to export
                console.log("Export data:", {
                    visibleNodes: visibleNodes.map((n) => ({
                        id: n.id,
                        x: n.x,
                        y: n.y,
                        parentId: n.parentId,
                        userMessage: n.userMessage?.substring(0, 20),
                    })),
                    nodePositions,
                });

                const htmlContent = await exportConversation({
                    conversationNodes: visibleNodes,
                    nodePositions,
                    user,
                    settings,
                    reactFlowRef,
                });

                // Create and download the HTML file
                const blob = new Blob([htmlContent], { type: "text/html" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `conversation-map-${new Date().toISOString().split("T")[0]}.html`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                setShowExportModal(false);
            } catch (error) {
                console.error("Export failed:", error);
                alert("Export failed. Please try again.");
            }
        },
        [conversationNodes, user],
    );

    return (
        <div className="conversation-canvas">
            <div className="canvas-toolbar">
                <ExportButton
                    conversationNodes={conversationNodes || []}
                    activeNodeId={activeNodeId}
                    onExport={handleExportClick}
                />
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleExpandAll}
                    title="Expand all visible nodes"
                    className="me-2"
                >
                    Expand All
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCollapseAll}
                    title="Collapse all visible nodes"
                    className="me-2"
                >
                    Collapse All
                </Button>
                <button
                    className="auto-layout-button"
                    onClick={handleAutoLayout}
                    disabled={isLayouting}
                    title="Auto-arrange nodes with context-aware positioning"
                >
                    {isLayouting ? "Calculating..." : "Auto Layout"}
                </button>
            </div>

            <ReactFlow
                ref={reactFlowRef}
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onNodeDragStop={onNodeDragStop}
                nodeTypes={nodeTypes}
                fitView
            >
                <Background />
                <Controls />
                <MiniMap />
            </ReactFlow>

            <ExportModal
                show={showExportModal}
                onHide={handleExportModalClose}
                conversationNodes={conversationNodes || []}
                user={user}
                onExport={handleExport}
            />
        </div>
    );
}

export default ConversationCanvas;
