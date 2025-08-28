function getDirectReactFlowPositions(nodePositions) {
    // Use ReactFlow positions directly without any transformation
    // ReactFlow stores exact pixel positions that should be used as-is
    return nodePositions;
}

function calculateSVGViewBox(nodePositions, _isFullTree) {
    if (!nodePositions || Object.keys(nodePositions).length === 0) {
        return "0 0 800 600";
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    // Find bounding box using pre-adjusted positions
    Object.values(nodePositions).forEach((position) => {
        minX = Math.min(minX, position.x);
        minY = Math.min(minY, position.y);
        maxX = Math.max(maxX, position.x + 250); // Add node width
        maxY = Math.max(maxY, position.y + 150); // Add estimated node height
    });

    // Add padding around content
    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    // Calculate width and height
    const width = maxX - minX;
    const height = maxY - minY;

    return `${minX} ${minY} ${width} ${height}`;
}

export default {
    getDirectReactFlowPositions,
    calculateSVGViewBox,
};
