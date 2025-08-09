import { DagreLayoutEngine } from "../utils/layoutEngines/dagreEngine.js";
import { LAYOUT_CONFIG } from "../constants/layoutConfig.js";

/**
 * Main layout service providing pluggable layout engines for conversation trees
 */
export class LayoutService {
    constructor(engine = "dagre", config = {}) {
        this.currentEngine = null;
        this.availableEngines = new Map([["dagre", DagreLayoutEngine]]);
        this.config = {
            direction: LAYOUT_CONFIG.DIRECTIONS.TOP_TO_BOTTOM,
            density: "NORMAL",
            ...config,
        };

        this.setEngine(engine);
    }

    /**
     * Calculate layout positions for conversation nodes
     * @param {Array} nodes - Conversation nodes with dimensions and relationships
     * @param {Array} edges - Parent-child edge relationships
     * @param {Object} options - Layout options and overrides
     * @returns {Promise<LayoutResult>} Layout result with updated positions
     */
    async calculateLayout(nodes, edges, options = {}) {
        const startTime = performance.now();

        try {
            // Validate input parameters
            if (!nodes || !Array.isArray(nodes)) {
                throw new Error("Invalid nodes parameter: must be an array");
            }

            if (nodes.length === 0) {
                return {
                    success: true,
                    positions: new Map(),
                    metadata: {
                        nodeCount: 0,
                        calculationTime: 0,
                        engine: this.currentEngine?.constructor.name,
                    },
                };
            }

            // Filter out pinned nodes from layout calculation
            const unpinnedNodes = nodes.filter((node) => !node.isPinned);
            const pinnedNodes = nodes.filter((node) => node.isPinned);

            // If no nodes need layout calculation, return early
            if (unpinnedNodes.length === 0) {
                const existingPositions = new Map();
                pinnedNodes.forEach((node) => {
                    existingPositions.set(node.id, { x: node.x || 0, y: node.y || 0 });
                });

                return {
                    success: true,
                    positions: existingPositions,
                    metadata: {
                        nodeCount: nodes.length,
                        pinnedCount: pinnedNodes.length,
                        calculationTime: performance.now() - startTime,
                        engine: this.currentEngine?.constructor.name,
                    },
                };
            }

            // Prepare layout engine with current configuration
            const layoutOptions = {
                ...this.config,
                ...options,
            };

            if (this.currentEngine) {
                if (layoutOptions.direction) {
                    this.currentEngine.setDirection(layoutOptions.direction);
                }
                if (layoutOptions.density) {
                    this.currentEngine.setDensity(layoutOptions.density);
                }
            }

            // Calculate positions for unpinned nodes
            const layoutPositions = await this.currentEngine.calculateLayout(unpinnedNodes, edges);

            // Combine with existing pinned node positions
            const finalPositions = new Map(layoutPositions);
            pinnedNodes.forEach((node) => {
                finalPositions.set(node.id, { x: node.x || 0, y: node.y || 0 });
            });

            const calculationTime = performance.now() - startTime;

            // Check performance targets
            this._checkPerformanceTargets(nodes.length, calculationTime);

            return {
                success: true,
                positions: finalPositions,
                metadata: {
                    nodeCount: nodes.length,
                    unpinnedCount: unpinnedNodes.length,
                    pinnedCount: pinnedNodes.length,
                    calculationTime,
                    engine: this.currentEngine?.constructor.name,
                    config: layoutOptions,
                },
            };
        } catch (error) {
            console.error("Layout calculation failed:", error);

            return {
                success: false,
                error: error.message,
                positions: this._createEmergencyLayout(nodes),
                metadata: {
                    nodeCount: nodes.length,
                    calculationTime: performance.now() - startTime,
                    engine: "fallback",
                },
            };
        }
    }

    /**
     * Set the current layout engine
     * @param {string} engineName - Name of the engine to use
     */
    setEngine(engineName) {
        if (!this.availableEngines.has(engineName)) {
            console.warn(
                `Unknown layout engine: ${engineName}. Available engines: ${Array.from(this.availableEngines.keys()).join(", ")}`,
            );
            engineName = "dagre"; // fallback to default
        }

        const EngineClass = this.availableEngines.get(engineName);
        this.currentEngine = new EngineClass(this.config);
    }

    /**
     * Get list of available layout engines
     * @returns {string[]} Array of available engine names
     */
    getAvailableEngines() {
        return Array.from(this.availableEngines.keys());
    }

    /**
     * Update layout configuration
     * @param {Object} newConfig - Configuration updates
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };

        // Apply config changes to current engine
        if (this.currentEngine) {
            if (newConfig.direction) {
                this.currentEngine.setDirection(newConfig.direction);
            }
            if (newConfig.density) {
                this.currentEngine.setDensity(newConfig.density);
            }
        }
    }

    /**
     * Get current configuration
     * @returns {Object} Current layout configuration
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Register a new layout engine
     * @param {string} name - Engine name
     * @param {Class} engineClass - Engine class constructor
     */
    registerEngine(name, engineClass) {
        this.availableEngines.set(name, engineClass);
    }

    /**
     * Check if calculation time meets performance targets
     * @private
     */
    _checkPerformanceTargets(nodeCount, calculationTime) {
        const targets = LAYOUT_CONFIG.PERFORMANCE_TARGETS;
        let targetTime;

        if (nodeCount < 50) {
            targetTime = targets.SMALL_TREE_MS;
        } else if (nodeCount < 100) {
            targetTime = targets.MEDIUM_TREE_MS;
        } else {
            targetTime = targets.LARGE_TREE_MS;
        }

        if (calculationTime > targetTime) {
            console.warn(
                `Layout calculation took ${calculationTime.toFixed(2)}ms for ${nodeCount} nodes (target: ${targetTime}ms)`,
            );
        }
    }

    /**
     * Create emergency fallback layout for error cases
     * @private
     */
    _createEmergencyLayout(nodes) {
        const positions = new Map();
        const gridCols = Math.ceil(Math.sqrt(nodes.length));

        nodes.forEach((node, index) => {
            // Preserve existing positions for pinned nodes
            if (node.isPinned && (node.x !== undefined || node.y !== undefined)) {
                positions.set(node.id, { x: node.x || 0, y: node.y || 0 });
                return;
            }

            // Simple grid layout for unpinned nodes
            const col = index % gridCols;
            const row = Math.floor(index / gridCols);
            const x = col * (LAYOUT_CONFIG.DEFAULT_NODE_WIDTH + LAYOUT_CONFIG.HORIZONTAL_PADDING);
            const y = row * (LAYOUT_CONFIG.DEFAULT_NODE_HEIGHT + LAYOUT_CONFIG.VERTICAL_PADDING);

            positions.set(node.id, { x, y });
        });

        return positions;
    }
}

/**
 * Factory function to create a layout service instance
 * @param {string} engine - Engine name (default: 'dagre')
 * @param {Object} config - Initial configuration
 * @returns {LayoutService} Configured layout service instance
 */
export function createLayoutService(engine = "dagre", config = {}) {
    return new LayoutService(engine, config);
}

/**
 * Default layout service instance for simple usage
 */
export const defaultLayoutService = createLayoutService();
