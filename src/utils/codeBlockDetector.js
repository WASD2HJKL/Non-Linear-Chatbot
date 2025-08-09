/**
 * Code Block Detection Utility
 *
 * This utility detects and extracts code blocks from markdown content
 * for display in the CodeModal component.
 *
 * Supports both fenced code blocks (```) and indented code blocks.
 */

/**
 * Detects code blocks in markdown content
 * @param {string} markdownContent - Raw markdown text
 * @returns {Object} - Object with hasCodeBlocks boolean and codeBlocks array
 */
function detectCodeBlocks(markdownContent) {
    if (!markdownContent || typeof markdownContent !== "string") {
        return { hasCodeBlocks: false, codeBlocks: [] };
    }

    const codeBlocks = [];

    try {
        // Regex to match fenced code blocks (``` or ~~~ with optional language)
        const fencedCodeBlockRegex = /^```(\w+)?\s*\n([\s\S]*?)^```\s*$/gm;

        // Regex to match inline code blocks (`code`)
        const inlineCodeRegex = /`([^`\n]+)`/g;

        // Find all fenced code blocks
        let match;
        while ((match = fencedCodeBlockRegex.exec(markdownContent)) !== null) {
            const language = match[1] || "text";
            const code = match[2].trim();

            if (code.length > 0) {
                codeBlocks.push({
                    type: "fenced",
                    language: language,
                    content: code,
                    raw: match[0],
                });
            }
        }

        // Find inline code blocks only if they're long enough to benefit from modal view
        const inlineMatches = Array.from(markdownContent.matchAll(inlineCodeRegex));
        for (const inlineMatch of inlineMatches) {
            const code = inlineMatch[1];

            // Only include inline code that's longer than 30 characters
            if (code.length > 30) {
                codeBlocks.push({
                    type: "inline",
                    language: "text",
                    content: code,
                    raw: inlineMatch[0],
                });
            }
        }

        return {
            hasCodeBlocks: codeBlocks.length > 0,
            codeBlocks: codeBlocks,
        };
    } catch (error) {
        console.error("Error detecting code blocks:", error);
        return { hasCodeBlocks: false, codeBlocks: [] };
    }
}

/**
 * Extracts and formats code content for display
 * @param {Array} codeBlocks - Array of code block objects
 * @returns {Array} - Formatted code blocks for display
 */
function extractCodeContent(codeBlocks) {
    if (!Array.isArray(codeBlocks)) {
        return [];
    }

    return codeBlocks.map((block, index) => ({
        id: `code-block-${index}`,
        language: block.language || "text",
        content: block.content,
        type: block.type,
        displayName: block.type === "fenced" ? `Code Block (${block.language})` : "Inline Code",
    }));
}

/**
 * Checks if content has any code blocks (quick check)
 * @param {string} markdownContent - Raw markdown text
 * @returns {boolean} - True if code blocks are detected
 */
function hasCodeBlocks(markdownContent) {
    if (!markdownContent || typeof markdownContent !== "string") {
        return false;
    }

    // Quick check for fenced code blocks
    const hasFenced = /```[\s\S]*?```/.test(markdownContent);

    // Quick check for significant inline code (> 30 chars)
    const longInlineCode = /`[^`\n]{30,}`/.test(markdownContent);

    return hasFenced || longInlineCode;
}

export { detectCodeBlocks, extractCodeContent, hasCodeBlocks };
