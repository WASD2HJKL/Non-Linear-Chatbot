function generatePath(sourcePos, targetPos, pathType = "curved") {
    const sourceX = sourcePos.x + 250; // Start from right edge of source node
    const sourceY = sourcePos.y + 75; // Middle of source node height
    const targetX = targetPos.x; // Left edge of target node
    const targetY = targetPos.y + 75; // Middle of target node height

    switch (pathType) {
        case "straight":
            return generateStraightPath(sourceX, sourceY, targetX, targetY);

        case "stepped":
            return generateSteppedPath(sourceX, sourceY, targetX, targetY);

        case "curved":
        default:
            return generateCurvedPath(sourceX, sourceY, targetX, targetY);
    }
}

function generateStraightPath(x1, y1, x2, y2) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
}

function generateSteppedPath(x1, y1, x2, y2) {
    const midX = x1 + (x2 - x1) / 2;
    return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
}

function generateCurvedPath(x1, y1, x2, y2) {
    // Calculate control points for a smooth curve
    const dx = x2 - x1;

    // Control point offset - stronger curve for longer distances
    const controlOffset = Math.min(Math.abs(dx) * 0.5, 150);

    const cp1x = x1 + controlOffset;
    const cp1y = y1;
    const cp2x = x2 - controlOffset;
    const cp2y = y2;

    // Generate cubic Bezier curve
    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
}

export default {
    generatePath,
};
