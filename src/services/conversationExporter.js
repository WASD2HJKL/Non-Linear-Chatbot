import metadataCollector from "./metadataCollector";
import htmlNodeRenderer from "./htmlNodeRenderer";
import svgTreeRenderer from "./svgTreeRenderer";
import exportTemplate from "../templates/exportTemplate";
import html2canvas from "html2canvas";

async function exportConversation(options) {
    try {
        // Input validation - support both old and new formats
        if (!options || (!options.conversationTree && !options.conversationNodes)) {
            throw new Error("Missing required options: conversationTree or conversationNodes is required");
        }

        const { conversationTree, conversationNodes, nodePositions, user, settings, reactFlowRef } = options;

        // Convert new node format to old tree format if needed
        const actualConversationTree = conversationTree || convertNodesToTree(conversationNodes, nodePositions);
        const actualNodePositions = nodePositions || {};

        // Collect metadata
        const metadata = metadataCollector.collectMetadata(user, actualConversationTree, settings);

        // Calculate container dimensions and adjust node positions to be relative to container
        const truncatedContainerDims = calculateContainerDimensions(actualNodePositions, false);
        const fullTreeContainerDims = calculateContainerDimensions(actualNodePositions, true);

        // Adjust node positions to be relative to container bounds
        const adjustedNodePositions = adjustNodePositionsToContainer(actualNodePositions, truncatedContainerDims);

        // Generate cross-reference mapping between truncated and full tree nodes
        const crossRefMap = {};
        Object.keys(actualConversationTree).forEach((nodeId) => {
            if (nodeId !== "root") {
                crossRefMap[`truncated-${nodeId}`] = `full-${nodeId}`;
                crossRefMap[`full-${nodeId}`] = `truncated-${nodeId}`;
            }
        });

        // Generate truncated tree HTML nodes
        const truncatedTreeHTML = htmlNodeRenderer.generateHTMLNodes(
            actualConversationTree,
            adjustedNodePositions,
            false, // isFullTree
            crossRefMap,
            truncatedContainerDims,
        );

        // Generate full tree HTML nodes (with wider spacing)
        const fullTreeNodePositions = adjustNodePositionsToContainer(actualNodePositions, fullTreeContainerDims, true);
        const fullTreeHTML = htmlNodeRenderer.generateHTMLNodes(
            actualConversationTree,
            fullTreeNodePositions,
            true, // isFullTree
            crossRefMap,
            fullTreeContainerDims,
        );

        // Generate SVG connections for truncated tree
        const truncatedTreeSVG = svgTreeRenderer.generateSVGTree(
            actualConversationTree,
            adjustedNodePositions,
            false, // isFullTree
        );

        // Generate SVG connections for full tree
        const fullTreeSVG = svgTreeRenderer.generateSVGTree(
            actualConversationTree,
            fullTreeNodePositions,
            true, // isFullTree
        );

        // Overview image generation removed - Interactive Tree View provides complete overview

        // Load and populate HTML template
        let htmlContent = exportTemplate;

        // Replace template placeholders
        htmlContent = htmlContent
            .replace("{{TITLE}}", metadata.conversationTitle || "Conversation Map Export")
            .replace("{{METADATA_HEADER}}", generateMetadataHeader(metadata, settings))
            .replace("{{OVERVIEW_IMAGE}}", "") // Overview section removed
            .replace("{{TRUNCATED_TREE_SVG}}", truncatedTreeSVG)
            .replace("{{TRUNCATED_TREE_NODES}}", truncatedTreeHTML)
            .replace(
                "{{TRUNCATED_CONTAINER_STYLE}}",
                `width: ${truncatedContainerDims.width}px; height: ${truncatedContainerDims.height}px;`,
            )
            .replace("{{FULL_TREE_SVG}}", fullTreeSVG)
            .replace("{{FULL_TREE_NODES}}", fullTreeHTML)
            .replace(
                "{{FULL_CONTAINER_STYLE}}",
                `width: ${fullTreeContainerDims.width}px; height: ${fullTreeContainerDims.height}px;`,
            )
            .replace("{{METADATA_FOOTER}}", generateMetadataFooter(metadata, settings))
            .replace("{{NAVIGATION_JS}}", generateNavigationScript());

        return htmlContent;
    } catch (error) {
        console.error("Export failed:", error);
        throw new Error(`Export failed: ${error.message}`);
    }
}

function generateMetadataHeader(metadata, settings) {
    let header = '<div class="metadata-header">';

    if (settings.includeConversationTitle && metadata.conversationTitle) {
        header += `<h1>${metadata.conversationTitle}</h1>`;
    }

    if (settings.includeTimestamps) {
        header += `<p class="export-timestamp">Exported on: ${metadata.exportTimestamp}</p>`;
    }

    if (settings.includeUserInfo && metadata.userInfo) {
        header += `<p class="user-info">User: ${metadata.userInfo}</p>`;
    }

    header += "</div>";
    return header;
}

function generateMetadataFooter(metadata, settings) {
    let footer = '<div class="metadata-footer">';

    if (settings.includeTimestamps) {
        footer += `<p>Created: ${metadata.creationTimestamp} | Exported: ${metadata.exportTimestamp}</p>`;
    }

    footer += `<p>Total nodes: ${metadata.nodeCount} | Total messages: ${metadata.messageCount}</p>`;
    footer += "</div>";
    return footer;
}

function generateNavigationScript() {
    return `
        <script>
            function navigateToNode(targetId) {
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetElement.style.boxShadow = '0 0 15px rgba(0, 150, 255, 0.8)';
                    setTimeout(() => {
                        targetElement.style.boxShadow = '';
                    }, 2000);
                }
            }
            
            // Add click handlers to navigation buttons
            document.addEventListener('DOMContentLoaded', function() {
                const navButtons = document.querySelectorAll('.nav-button');
                navButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const targetId = this.getAttribute('data-target');
                        navigateToNode(targetId);
                    });
                });
            });
        </script>
    `;
}

function calculateContainerDimensions(nodePositions, isFullTree) {
    if (!nodePositions || Object.keys(nodePositions).length === 0) {
        return { width: 800, height: 600 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    // Find bounding box of all node positions
    Object.values(nodePositions).forEach((position) => {
        let adjustedPosition = position;

        // Apply spacing adjustments for full tree
        if (isFullTree) {
            adjustedPosition = {
                x: position.x * 1.5,
                y: position.y,
            };
        }

        minX = Math.min(minX, adjustedPosition.x);
        minY = Math.min(minY, adjustedPosition.y);
        maxX = Math.max(maxX, adjustedPosition.x + 250); // Add node width
        maxY = Math.max(maxY, adjustedPosition.y + 150); // Add estimated node height
    });

    // Add padding around content
    const padding = 50;
    const width = Math.max(800, maxX - minX + padding * 2);
    const height = Math.max(600, maxY - minY + padding * 2);

    return { width, height };
}

/**
 * Adjust node positions to be relative to container bounds
 * @param {Object} nodePositions - Original node positions
 * @param {Object} containerDims - Container dimensions with bounds info
 * @param {Boolean} isFullTree - Whether this is for the full tree (wider spacing)
 * @returns {Object} Adjusted node positions
 */
function adjustNodePositionsToContainer(nodePositions, containerDims, isFullTree = false) {
    if (!nodePositions || Object.keys(nodePositions).length === 0) {
        return nodePositions;
    }

    // Calculate bounding box to find offset
    let minX = Infinity;
    let minY = Infinity;

    Object.values(nodePositions).forEach((position) => {
        let adjustedPosition = position;

        // Apply spacing adjustments for full tree
        if (isFullTree) {
            adjustedPosition = {
                x: position.x * 1.5,
                y: position.y,
            };
        }

        minX = Math.min(minX, adjustedPosition.x);
        minY = Math.min(minY, adjustedPosition.y);
    });

    // Add padding offset
    const padding = 50;
    const offsetX = -minX + padding;
    const offsetY = -minY + padding;

    console.log(
        `Position adjustment: minX=${minX}, minY=${minY}, offsetX=${offsetX}, offsetY=${offsetY}, isFullTree=${isFullTree}`,
    );

    // Adjust all positions
    const adjustedPositions = {};
    Object.entries(nodePositions).forEach(([nodeId, position]) => {
        let adjustedPosition = position;

        // Apply spacing adjustments for full tree
        if (isFullTree) {
            adjustedPosition = {
                x: position.x * 1.5,
                y: position.y,
            };
        }

        adjustedPositions[nodeId] = {
            x: adjustedPosition.x + offsetX,
            y: adjustedPosition.y + offsetY,
        };
    });

    return adjustedPositions;
}

/**
 * Convert new node-based format to old tree format for backward compatibility
 * @param {Array} conversationNodes - Array of node objects
 * @returns {Object} Tree structure compatible with existing export functions
 */
function convertNodesToTree(conversationNodes, nodePositions) {
    if (!conversationNodes || conversationNodes.length === 0) {
        return { root: { id: "root", messages: [], children: [], parentId: null } };
    }

    // Only filter based on visible field, not content (root nodes may have empty messages)
    const visibleNodes = conversationNodes.filter((node) => node.visible !== false);

    if (visibleNodes.length === 0) {
        return { root: { id: "root", messages: [], children: [], parentId: null } };
    }

    const tree = {
        root: {
            id: "root",
            messages: [
                {
                    role: "developer",
                    content:
                        "You are a helpful assistant. Your goal is to help the user with whatever queries they have.",
                },
                { role: "assistant", content: "Hello! How can I help you today?" },
            ],
            children: [],
            parentId: null,
        },
    };

    // Convert each visible node to the old branch format
    visibleNodes.forEach((node) => {
        const branch = {
            id: node.id,
            messages: [
                {
                    role: "developer",
                    content:
                        "You are a helpful assistant. Your goal is to help the user with whatever queries they have.",
                },
                { role: "assistant", content: "Hello! How can I help you today?" },
                { role: "user", content: node.userMessage || "" },
                { role: "assistant", content: node.assistantMessage || "" },
            ],
            children: [],
            parentId: node.parentId || "root",
            // Include summary and width data for export
            summary: node.summary || null,
            width: node.width || 250,
        };

        tree[node.id] = branch;

        // Add to parent's children array - only if parent exists in visible nodes
        if (node.parentId) {
            const parentExists = visibleNodes.some((n) => n.id === node.parentId);
            if (parentExists && tree[node.parentId]) {
                tree[node.parentId].children.push(node.id);
            } else if (!parentExists) {
                // If parent doesn't exist in visible nodes, make this a root child
                tree.root.children.push(node.id);
                branch.parentId = "root";
            }
        } else {
            // This is a root node - it should be a child of the invisible root
            tree.root.children.push(node.id);
        }
    });

    // Build children relationships for visible nodes only
    visibleNodes.forEach((node) => {
        const children = visibleNodes.filter((child) => child.parentId === node.id);
        if (tree[node.id]) {
            tree[node.id].children = children.map((child) => child.id);
        }
    });

    // Debug: log the converted tree structure
    console.log("Converted tree structure:", tree);
    console.log("Node positions available:", nodePositions);

    // Debug: check if root node has position
    if (nodePositions && nodePositions["root"]) {
        console.log("Root node position:", nodePositions["root"]);
    } else {
        console.log("No position found for root node");
    }

    return tree;
}

export default exportConversation;
