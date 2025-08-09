import coordinateMapper from "../utils/coordinateMapper";
import edgePathGenerator from "../utils/edgePathGenerator";

function generateSVGTree(conversationTree, nodePositions, isFullTree) {
    if (!conversationTree || Object.keys(conversationTree).length === 0) {
        return "";
    }

    // Calculate SVG viewBox dimensions based on node positions
    const viewBox = coordinateMapper.calculateSVGViewBox(nodePositions, isFullTree);

    // Create SVG root element with proper namespace
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" class="tree-svg">`;

    // Define arrow markers
    svg += `
        <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                    refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#888" />
            </marker>
        </defs>
    `;

    // Process all parent-child relationships to create connections
    const processedEdges = new Set();

    Object.values(conversationTree).forEach((node) => {
        if (node.parentId && node.parentId !== "root") {
            const edgeId = `${node.parentId}-${node.id}`;

            // Skip if we've already processed this edge
            if (processedEdges.has(edgeId)) {
                return;
            }
            processedEdges.add(edgeId);

            // Get parent and child positions
            let parentPos = nodePositions[node.parentId];
            let childPos = nodePositions[node.id];

            // Positioning adjustments are now handled at the export level
            // No need to adjust here as positions are already adjusted

            if (parentPos && childPos) {
                // Use ReactFlow positions directly for SVG
                const svgParentPos = parentPos;
                const svgChildPos = childPos;

                // Generate SVG path for the connection
                const pathData = edgePathGenerator.generatePath(svgParentPos, svgChildPos, "curved");

                // Add the path element to SVG
                svg += `<path d="${pathData}" 
                              stroke="#888" 
                              stroke-width="2" 
                              fill="none" 
                              marker-end="url(#arrowhead)" 
                              class="tree-edge" />`;
            }
        }
    });

    svg += "</svg>";
    return svg;
}

// Spacing adjustments are now handled at the export level

export default {
    generateSVGTree,
};
