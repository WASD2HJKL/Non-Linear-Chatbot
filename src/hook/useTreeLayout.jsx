import { useCallback } from "react";
import { createLayoutService } from "../services/layoutService.js";

// This utility organizes nodes in a tree layout with context-awareness
export function useTreeLayout() {
    const layoutService = createLayoutService("dagre");
    // Calculate layout for conversation nodes using modern layout service
    const calculateTreeLayout = useCallback(
        async (nodes, dimensions = new Map(), options = {}) => {
            if (!nodes || nodes.length === 0) {
                return {};
            }

            try {
                // Convert nodes to format expected by layout service
                const layoutNodes = nodes.map((node) => ({
                    id: node.id,
                    width: dimensions.get(node.id)?.width || node.width || 250,
                    height: dimensions.get(node.id)?.height || 100,
                    isPinned: node.isPinned || false,
                    x: node.x,
                    y: node.y,
                }));

                // Create edges from parent-child relationships
                const edges = nodes
                    .filter((node) => node.parentId)
                    .map((node) => ({
                        source: node.parentId,
                        target: node.id,
                    }));

                // Calculate layout using service
                const result = await layoutService.calculateLayout(layoutNodes, edges, options);

                if (result.success) {
                    // Convert back to position object format
                    const positions = {};
                    result.positions.forEach((position, nodeId) => {
                        positions[nodeId] = position;
                    });
                    return positions;
                } else {
                    console.error("Layout calculation failed:", result.error);
                    return _createFallbackLayout(nodes);
                }
            } catch (error) {
                console.error("Tree layout calculation error:", error);
                return _createFallbackLayout(nodes);
            }
        },
        [layoutService],
    );

    // Create fallback layout for error cases
    const _createFallbackLayout = useCallback((nodes) => {
        const positions = {};
        const gridCols = Math.ceil(Math.sqrt(nodes.length));

        nodes.forEach((node, index) => {
            const col = index % gridCols;
            const row = Math.floor(index / gridCols);
            positions[node.id] = {
                x: col * 350,
                y: row * 200,
            };
        });

        return positions;
    }, []);

    return { calculateTreeLayout, _createFallbackLayout };
}

export default useTreeLayout;
