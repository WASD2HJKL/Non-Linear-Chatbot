import { useCallback } from "react";

// This utility organizes nodes in a tree layout
export function useTreeLayout() {
    // Calculate layout for the entire tree
    const calculateTreeLayout = useCallback(
        (conversationTree, nodePositions = {}) => {
            if (
                !conversationTree ||
                Object.keys(conversationTree).length === 0
            ) {
                return {};
            }

            const newPositions = { ...nodePositions };
            const horizontalSpacing = 350; // Space between levels
            const verticalSpacing = 200; // Space between siblings

            // First pass: determine level and siblings for each node
            const nodeInfo = {};

            const analyzeTree = (nodeId, level = 0) => {
                if (!conversationTree[nodeId]) return;

                // Record the node's level
                nodeInfo[nodeId] = {
                    level,
                    children: conversationTree[nodeId].children.length,
                };

                // Process children
                conversationTree[nodeId].children.forEach((childId) => {
                    analyzeTree(childId, level + 1);
                });
            };

            // Start analysis from root
            analyzeTree("root");

            // Second pass: calculate positions for each node
            const calculatePositions = (nodeId, startY = 50) => {
                if (!conversationTree[nodeId]) return { height: 0 };

                // Skip the root node if it only has the initial system/assistant messages
                const isRoot = conversationTree[nodeId].parentId === null;
                const skipNode =
                    isRoot && conversationTree[nodeId].messages.length <= 2;

                // Process children first to calculate total height
                let totalChildrenHeight = 0;
                let childHeights = [];

                conversationTree[nodeId].children.forEach((childId) => {
                    const childResult = calculatePositions(
                        childId,
                        startY + totalChildrenHeight,
                    );
                    totalChildrenHeight += childResult.height;
                    childHeights.push(childResult.height);
                });

                // If no children, this node has a fixed height
                if (totalChildrenHeight === 0) {
                    totalChildrenHeight = verticalSpacing;
                }

                // Determine position for this node
                if (!skipNode) {
                    const level = nodeInfo[nodeId].level;

                    // If position already exists, keep X and just adjust Y if needed
                    const existingPos = newPositions[nodeId];
                    if (existingPos) {
                        // Keep existing X position but adjust Y if it would overlap with siblings
                        const centerY = startY + totalChildrenHeight / 2;
                        if (
                            Math.abs(existingPos.y - centerY) > verticalSpacing
                        ) {
                            newPositions[nodeId] = {
                                x: existingPos.x,
                                y: centerY,
                            };
                        }
                    } else {
                        // New position
                        newPositions[nodeId] = {
                            x: level * horizontalSpacing + 50,
                            y: startY + totalChildrenHeight / 2,
                        };
                    }
                }

                return { height: totalChildrenHeight };
            };

            // Calculate positions starting from root
            calculatePositions("root");

            return newPositions;
        },
        [],
    );

    return { calculateTreeLayout };
}

export default useTreeLayout;
