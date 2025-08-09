import dagre from "dagre";
import { LAYOUT_CONFIG, calculateHorizontalSpacing, calculateVerticalSpacing } from "../../constants/layoutConfig.js";

/**
 * Dagre-specific layout engine implementation for ReactFlow integration
 */
export class DagreLayoutEngine {
    constructor(config = {}) {
        this.direction = config.direction || LAYOUT_CONFIG.DIRECTIONS.TOP_TO_BOTTOM;
        this.density = config.density || "NORMAL";
        this.graph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
        this.graph.setGraph({
            rankdir: this.direction,
            nodesep: config.nodesep || 50,
            ranksep: config.ranksep || 50,
            marginx: config.marginx || 20,
            marginy: config.marginy || 20,
        });
    }

    /**
     * Calculate layout positions for nodes using Dagre algorithm
     * @param {Array} nodes - Array of node objects with dimensions
     * @param {Array} edges - Array of edge objects with source/target
     * @returns {Promise<Map>} Map of node IDs to calculated positions
     */
    async calculateLayout(nodes, edges) {
        try {
            // Validate input data
            if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
                throw new Error("Invalid nodes data: must be non-empty array");
            }

            // Clear previous graph data
            this.graph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
            this.graph.setGraph({
                rankdir: this.direction,
                nodesep: this._calculateNodeSeparation(nodes),
                ranksep: this._calculateRankSeparation(nodes),
            });

            // Add nodes to dagre graph with actual dimensions
            for (const node of nodes) {
                const width = node.width || LAYOUT_CONFIG.DEFAULT_NODE_WIDTH;
                const height = node.height || LAYOUT_CONFIG.DEFAULT_NODE_HEIGHT;

                this.graph.setNode(node.id, {
                    width: width,
                    height: height,
                    label: node.id,
                });
            }

            // Add edges to dagre graph
            if (edges && Array.isArray(edges)) {
                for (const edge of edges) {
                    if (edge.source && edge.target) {
                        this.graph.setEdge(edge.source, edge.target);
                    }
                }
            }

            // Debug: Log graph configuration for LR layout
            if (this.direction === "LR") {
                const graphConfig = this.graph.graph();
                console.log("Dagre LR Layout Config:", {
                    direction: this.direction,
                    nodesep: graphConfig.nodesep,
                    ranksep: graphConfig.ranksep,
                    nodeCount: nodes.length,
                });
            }

            // Run dagre layout algorithm
            dagre.layout(this.graph);

            // Convert dagre positions to ReactFlow format
            const positionMap = new Map();

            for (const node of nodes) {
                const dagreNode = this.graph.node(node.id);
                if (dagreNode) {
                    // Dagre centers nodes, ReactFlow uses top-left positioning
                    const x = dagreNode.x - (node.width || LAYOUT_CONFIG.DEFAULT_NODE_WIDTH) / 2;
                    const y = dagreNode.y - (node.height || LAYOUT_CONFIG.DEFAULT_NODE_HEIGHT) / 2;

                    positionMap.set(node.id, { x, y });

                    // Debug: Log node positions for LR layout
                    if (this.direction === "LR") {
                        console.log(`Node ${node.id}: dagre(${dagreNode.x}, ${dagreNode.y}) -> reactflow(${x}, ${y})`);
                    }
                }
            }

            return positionMap;
        } catch (error) {
            console.error("Dagre layout calculation failed:", error);
            // Return fallback positions in case of error
            return this._createFallbackLayout(nodes);
        }
    }

    /**
     * Set layout direction
     * @param {string} direction - One of 'TB', 'LR', 'BT', 'RL'
     */
    setDirection(direction) {
        if (Object.values(LAYOUT_CONFIG.DIRECTIONS).includes(direction)) {
            this.direction = direction;
        } else {
            console.warn(`Invalid direction: ${direction}. Using default TB.`);
            this.direction = LAYOUT_CONFIG.DIRECTIONS.TOP_TO_BOTTOM;
        }
    }

    /**
     * Set layout spacing configuration
     * @param {number} horizontal - Horizontal spacing between nodes
     * @param {number} vertical - Vertical spacing between nodes
     */
    setSpacing(horizontal, vertical) {
        // Update graph configuration with new spacing
        this.graph.setGraph({
            ...this.graph.graph(),
            nodesep: horizontal || 50,
            ranksep: vertical || 50,
        });
    }

    /**
     * Set density mode for spacing calculations
     * @param {string} density - One of 'COMPACT', 'NORMAL', 'SPACIOUS'
     */
    setDensity(density) {
        if (Object.keys(LAYOUT_CONFIG.DENSITY_MODES).includes(density)) {
            this.density = density;
        } else {
            console.warn(`Invalid density mode: ${density}. Using NORMAL.`);
            this.density = "NORMAL";
        }
    }

    /**
     * Calculate dynamic node separation based on layout direction
     * @private
     */
    _calculateNodeSeparation(nodes) {
        const avgWidth =
            nodes.reduce((sum, node) => sum + (node.width || LAYOUT_CONFIG.DEFAULT_NODE_WIDTH), 0) / nodes.length;

        // In LR mode, nodesep controls vertical spacing between siblings
        // In TB mode, nodesep controls horizontal spacing between siblings
        if (this.direction === "LR") {
            return calculateVerticalSpacing(LAYOUT_CONFIG.DEFAULT_NODE_HEIGHT, this.density);
        } else {
            return calculateHorizontalSpacing(avgWidth, this.density);
        }
    }

    /**
     * Calculate dynamic rank separation based on layout direction
     * @private
     */
    _calculateRankSeparation(nodes) {
        const avgWidth =
            nodes.reduce((sum, node) => sum + (node.width || LAYOUT_CONFIG.DEFAULT_NODE_WIDTH), 0) / nodes.length;
        const avgHeight =
            nodes.reduce((sum, node) => sum + (node.height || LAYOUT_CONFIG.DEFAULT_NODE_HEIGHT), 0) / nodes.length;

        // In LR mode, ranksep controls horizontal spacing between levels (parent-child)
        // In TB mode, ranksep controls vertical spacing between levels
        if (this.direction === "LR") {
            // Extra horizontal space for arrows and better visual separation
            return calculateHorizontalSpacing(avgWidth, this.density) * 1.8;
        } else {
            return calculateVerticalSpacing(avgHeight, this.density);
        }
    }

    /**
     * Create fallback grid layout if Dagre fails
     * @private
     */
    _createFallbackLayout(nodes) {
        const positionMap = new Map();
        const gridCols = Math.ceil(Math.sqrt(nodes.length));

        nodes.forEach((node, index) => {
            const col = index % gridCols;
            const row = Math.floor(index / gridCols);
            const x = col * (LAYOUT_CONFIG.DEFAULT_NODE_WIDTH + LAYOUT_CONFIG.HORIZONTAL_PADDING);
            const y = row * (LAYOUT_CONFIG.DEFAULT_NODE_HEIGHT + LAYOUT_CONFIG.VERTICAL_PADDING);

            positionMap.set(node.id, { x, y });
        });

        return positionMap;
    }

    /**
     * Validate graph structure for cycles
     * @private
     */
    _validateGraphStructure(edges) {
        // Simple cycle detection using DFS
        const visited = new Set();
        const recursionStack = new Set();

        const hasCycle = (nodeId, adjacencyList) => {
            visited.add(nodeId);
            recursionStack.add(nodeId);

            const neighbors = adjacencyList.get(nodeId) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    if (hasCycle(neighbor, adjacencyList)) {
                        return true;
                    }
                } else if (recursionStack.has(neighbor)) {
                    return true;
                }
            }

            recursionStack.delete(nodeId);
            return false;
        };

        // Build adjacency list
        const adjacencyList = new Map();
        edges.forEach((edge) => {
            if (!adjacencyList.has(edge.source)) {
                adjacencyList.set(edge.source, []);
            }
            adjacencyList.get(edge.source).push(edge.target);
        });

        // Check for cycles from each node
        for (const [nodeId] of adjacencyList) {
            if (!visited.has(nodeId)) {
                if (hasCycle(nodeId, adjacencyList)) {
                    throw new Error(`Cycle detected in graph starting from node: ${nodeId}`);
                }
            }
        }
    }
}
