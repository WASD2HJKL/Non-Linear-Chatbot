import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import ConversationNode from "./ConversationNode";

// Custom node types
const nodeTypes = {
    conversationNode: ConversationNode,
};

function ConversationCanvas({
    conversationTree,
    activeBranchId,
    onBranchSelect,
}) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Convert the conversation tree to ReactFlow nodes and edges
    useEffect(() => {
        if (!conversationTree || Object.keys(conversationTree).length === 0) {
            return;
        }

        const newNodes = [];
        const newEdges = [];

        // Track positions to avoid overlaps
        const positionTracker = {};

        // Create a node for each branch in the tree
        const processNode = (branchId, level = 0, position = 0) => {
            const branch = conversationTree[branchId];
            if (!branch) return;

            // Skip the root node if it only has the initial developer/assistant messages
            const isRoot = branch.parentId === null;
            if (isRoot && branch.messages.length <= 2) {
                // Process children of root
                branch.children.forEach((childId, index) => {
                    processNode(childId, level, index);
                });
                return;
            }

            // Get the last user-assistant pair for display
            let nodeContent = { question: "", answer: "" };

            if (!isRoot) {
                // For non-root nodes, get the last user-assistant pair
                const messages = branch.messages;
                if (messages.length >= 4) {
                    // At least developer, assistant, user, assistant
                    const lastUserIndex = messages.findLastIndex(
                        (m) => m.role === "user",
                    );
                    if (
                        lastUserIndex >= 0 &&
                        lastUserIndex + 1 < messages.length
                    ) {
                        nodeContent = {
                            question: messages[lastUserIndex].content,
                            answer: messages[lastUserIndex + 1].content,
                        };
                    }
                }
            } else {
                // For root with content, just show the assistant's initial message
                nodeContent = {
                    question: "",
                    answer: branch.messages[1]?.content || "",
                };
            }

            // Calculate position to avoid overlaps
            if (!positionTracker[level]) {
                positionTracker[level] = 0;
            } else {
                positionTracker[level]++;
            }

            const xPosition = level * 300 + 50;
            const yPosition = positionTracker[level] * 200 + 50;

            // Create node
            newNodes.push({
                id: branch.id,
                type: "conversationNode",
                position: { x: xPosition, y: yPosition },
                data: {
                    question: nodeContent.question,
                    answer: nodeContent.answer,
                    isSelected: branch.id === activeBranchId,
                    onClick: () => onBranchSelect(branch.id),
                },
            });

            // Create edge from parent to this node
            if (branch.parentId && branch.parentId !== "root") {
                newEdges.push({
                    id: `e-${branch.parentId}-${branch.id}`,
                    source: branch.parentId,
                    target: branch.id,
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                    },
                    style: { stroke: "#888" },
                    animated: branch.id === activeBranchId,
                });
            }

            // Process children
            branch.children.forEach((childId, index) => {
                processNode(childId, level + 1, index);
            });
        };

        // Start processing from the root
        processNode("root");

        setNodes(newNodes);
        setEdges(newEdges);
    }, [conversationTree, activeBranchId, onBranchSelect]);

    // Handle node click
    const onNodeClick = useCallback((event, node) => {
        if (node.data.onClick) {
            node.data.onClick();
        }
    }, []);

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView>
            <Background />
            <Controls />
            <MiniMap />
        </ReactFlow>
    );
}

export default ConversationCanvas;
