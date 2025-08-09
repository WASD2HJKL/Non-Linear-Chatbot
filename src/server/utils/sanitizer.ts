import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize user-provided content to prevent XSS attacks
 * @param content Raw user input
 * @returns Sanitized content safe for storage and display
 */
export const sanitizeContent = (content: string): string => {
    try {
        // Configure DOMPurify for strict sanitization
        const clean = DOMPurify.sanitize(content, {
            ALLOWED_TAGS: [], // No HTML tags allowed - plain text only
            ALLOWED_ATTR: [],
            KEEP_CONTENT: true, // Keep text content but strip tags
            USE_PROFILES: { html: false, svg: false, mathMl: false },
        });

        return clean.trim();
    } catch (error) {
        console.error("[Sanitizer] Failed to sanitize content:", error);
        // Return empty string on error to prevent any potential XSS
        return "";
    }
};
