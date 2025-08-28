import { useState, useEffect, useRef, useCallback } from "react";
import { LAYOUT_CONFIG } from "../constants/layoutConfig.js";

/**
 * Custom hook to measure actual rendered dimensions of conversation nodes
 * Uses ResizeObserver for efficient dimension tracking
 */
export function useMeasureNodeDimensions(nodeIds = []) {
    const [dimensions, setDimensions] = useState(new Map());
    const [isReady, setIsReady] = useState(false);
    const observerRef = useRef(null);
    const elementsRef = useRef(new Map()); // Map of nodeId -> HTMLElement
    const pendingMeasurements = useRef(new Set());

    // Initialize ResizeObserver
    useEffect(() => {
        if (!window.ResizeObserver) {
            console.warn("ResizeObserver not supported, using fallback dimensions");
            setIsReady(true);
            return;
        }

        observerRef.current = new ResizeObserver((entries) => {
            const newDimensions = new Map(dimensions);
            let hasChanges = false;

            entries.forEach((entry) => {
                const element = entry.target;
                const nodeId = element.dataset.nodeId;

                if (nodeId) {
                    const { width, height } = entry.contentRect;
                    const roundedWidth = Math.round(width);
                    const roundedHeight = Math.round(height);

                    // Only update if dimensions changed significantly (avoid micro-changes)
                    const existing = newDimensions.get(nodeId);
                    if (
                        !existing ||
                        Math.abs(existing.width - roundedWidth) > 1 ||
                        Math.abs(existing.height - roundedHeight) > 1
                    ) {
                        newDimensions.set(nodeId, {
                            width: roundedWidth,
                            height: roundedHeight,
                            measuredAt: Date.now(),
                        });
                        hasChanges = true;
                        pendingMeasurements.current.delete(nodeId);
                    }
                }
            });

            if (hasChanges) {
                setDimensions(newDimensions);

                // Check if all expected measurements are complete
                const allMeasured = nodeIds.every(
                    (id) => newDimensions.has(id) && !pendingMeasurements.current.has(id),
                );

                if (allMeasured && nodeIds.length > 0) {
                    setIsReady(true);
                }
            }
        });

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [nodeIds.join(",")]); // Recreate observer when nodeIds change

    // Update ready state when nodeIds change
    useEffect(() => {
        if (nodeIds.length === 0) {
            setIsReady(true);
            return;
        }

        const allMeasured = nodeIds.every((id) => dimensions.has(id));
        setIsReady(allMeasured);

        // Add any new nodeIds to pending measurements
        nodeIds.forEach((id) => {
            if (!dimensions.has(id)) {
                pendingMeasurements.current.add(id);
            }
        });
    }, [nodeIds.join(","), dimensions]);

    /**
     * Create a ref callback for measuring a specific node
     * @param {string} nodeId - Unique identifier for the node
     * @returns {function} Ref callback to attach to the DOM element
     */
    const measureRef = useCallback((nodeId) => {
        return (element) => {
            if (!nodeId) return;

            // Remove previous element for this nodeId
            const previousElement = elementsRef.current.get(nodeId);
            if (previousElement && observerRef.current) {
                observerRef.current.unobserve(previousElement);
                elementsRef.current.delete(nodeId);
            }

            if (element && observerRef.current) {
                // Add nodeId as data attribute for identification
                element.dataset.nodeId = nodeId;
                elementsRef.current.set(nodeId, element);
                observerRef.current.observe(element);
                pendingMeasurements.current.add(nodeId);

                // For immediate measurement, get current dimensions
                const rect = element.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    setDimensions((prevDimensions) => {
                        const newDimensions = new Map(prevDimensions);
                        newDimensions.set(nodeId, {
                            width: Math.round(rect.width),
                            height: Math.round(rect.height),
                            measuredAt: Date.now(),
                        });
                        return newDimensions;
                    });
                    pendingMeasurements.current.delete(nodeId);
                }
            }
        };
    }, []);

    /**
     * Get dimensions for a specific node with fallback
     * @param {string} nodeId - Node identifier
     * @returns {Object} Dimensions object with width and height
     */
    const getDimensions = useCallback(
        (nodeId) => {
            const measured = dimensions.get(nodeId);
            if (measured) {
                return measured;
            }

            // Return fallback dimensions
            return {
                width: LAYOUT_CONFIG.DEFAULT_NODE_WIDTH,
                height: LAYOUT_CONFIG.DEFAULT_NODE_HEIGHT,
                measuredAt: null,
                fallback: true,
            };
        },
        [dimensions],
    );

    /**
     * Check if dimensions are available for a specific node
     * @param {string} nodeId - Node identifier
     * @returns {boolean} True if dimensions are measured
     */
    const hasDimensions = useCallback(
        (nodeId) => {
            return dimensions.has(nodeId);
        },
        [dimensions],
    );

    /**
     * Clear all measurements (useful for reset scenarios)
     */
    const clearMeasurements = useCallback(() => {
        setDimensions(new Map());
        setIsReady(false);
        pendingMeasurements.current.clear();

        // Disconnect all observed elements
        if (observerRef.current) {
            observerRef.current.disconnect();
        }
        elementsRef.current.clear();
    }, []);

    /**
     * Force re-measurement of all tracked nodes
     */
    const remeasure = useCallback(() => {
        elementsRef.current.forEach((element, _nodeId) => {
            if (element && observerRef.current) {
                // Trigger re-measurement by briefly unobserving and re-observing
                observerRef.current.unobserve(element);
                setTimeout(() => {
                    if (observerRef.current && element) {
                        observerRef.current.observe(element);
                    }
                }, 0);
            }
        });
    }, []);

    /**
     * Get summary statistics about measured dimensions
     */
    const getStats = useCallback(() => {
        const measured = Array.from(dimensions.values());
        if (measured.length === 0) {
            return {
                count: 0,
                avgWidth: LAYOUT_CONFIG.DEFAULT_NODE_WIDTH,
                avgHeight: LAYOUT_CONFIG.DEFAULT_NODE_HEIGHT,
                maxWidth: LAYOUT_CONFIG.DEFAULT_NODE_WIDTH,
                maxHeight: LAYOUT_CONFIG.DEFAULT_NODE_HEIGHT,
            };
        }

        const widths = measured.map((d) => d.width);
        const heights = measured.map((d) => d.height);

        return {
            count: measured.length,
            avgWidth: widths.reduce((a, b) => a + b, 0) / widths.length,
            avgHeight: heights.reduce((a, b) => a + b, 0) / heights.length,
            maxWidth: Math.max(...widths),
            maxHeight: Math.max(...heights),
            minWidth: Math.min(...widths),
            minHeight: Math.min(...heights),
        };
    }, [dimensions]);

    return {
        dimensions,
        measureRef,
        isReady,
        getDimensions,
        hasDimensions,
        clearMeasurements,
        remeasure,
        getStats,
    };
}
