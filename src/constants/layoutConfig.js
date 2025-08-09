// Layout configuration constants for the Auto Layout system
export const LAYOUT_CONFIG = {
    // Spacing constants
    HORIZONTAL_SPACING_BASE: 350,
    VERTICAL_SPACING_BASE: 200,

    // Dynamic padding formulas
    HORIZONTAL_PADDING: 40, // nodeWidth + 40px
    VERTICAL_PADDING: 20, // nodeHeight + 20px

    // Node dimension defaults
    DEFAULT_NODE_WIDTH: 250,
    DEFAULT_NODE_HEIGHT: 100,
    MIN_NODE_WIDTH: 150,
    MAX_NODE_WIDTH: 800,

    // Layout directions
    DIRECTIONS: {
        TOP_TO_BOTTOM: "TB",
        LEFT_TO_RIGHT: "LR",
        BOTTOM_TO_TOP: "BT",
        RIGHT_TO_LEFT: "RL",
    },

    // Performance thresholds
    PERFORMANCE_TARGETS: {
        SMALL_TREE_MS: 50, // < 50 nodes
        MEDIUM_TREE_MS: 100, // < 100 nodes
        LARGE_TREE_MS: 500, // < 500 nodes
    },

    // Spacing density modes
    DENSITY_MODES: {
        COMPACT: {
            horizontalMultiplier: 0.8,
            verticalMultiplier: 0.7,
        },
        NORMAL: {
            horizontalMultiplier: 1.0,
            verticalMultiplier: 1.0,
        },
        SPACIOUS: {
            horizontalMultiplier: 1.3,
            verticalMultiplier: 1.5,
        },
    },

    // LR-specific spacing multipliers
    LR_SPACING_MULTIPLIERS: {
        RANK_SEPARATION: 1.0, // Extra horizontal space for parent-child (arrows)
        NODE_SEPARATION: 1.0, // Tighter vertical space for siblings
        MIN_ARROW_SPACE: 75, // Minimum space to ensure arrows are visible
    },
};

// Helper functions for layout calculations
export const calculateHorizontalSpacing = (nodeWidth, density = "NORMAL") => {
    const config = LAYOUT_CONFIG.DENSITY_MODES[density];
    return (nodeWidth + LAYOUT_CONFIG.HORIZONTAL_PADDING) * config.horizontalMultiplier;
};

export const calculateVerticalSpacing = (nodeHeight, density = "NORMAL") => {
    const config = LAYOUT_CONFIG.DENSITY_MODES[density];
    return (nodeHeight + LAYOUT_CONFIG.VERTICAL_PADDING) * config.verticalMultiplier;
};
