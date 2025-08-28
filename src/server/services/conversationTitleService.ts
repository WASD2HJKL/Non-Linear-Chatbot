import { sanitizeContent } from "../utils/sanitizer";

type UpdateConversationTitleInput = {
    conversationId: string;
    title: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findRootNode(conversationId: string, context: any): Promise<{ summary: string } | null> {
    try {
        const rootNode = await context.entities.Node.findFirst({
            where: {
                conversationId,
                parentId: null,
                visible: true,
                userId: context.user.id,
            },
        });
        return rootNode;
    } catch (error: unknown) {
        console.error("[TITLE_SERVICE] Error finding root node:", error as Error);
        return null;
    }
}

function computeTitleFromSummary(summary: string): string {
    // Check for empty, null, or whitespace-only summaries
    if (!summary || typeof summary !== "string" || summary.trim() === "") {
        return "Untitled Conversation";
    }

    // Sanitize content using existing utility
    const sanitizedSummary = sanitizeContent(summary);

    // Check again after sanitization
    if (!sanitizedSummary || sanitizedSummary.trim() === "") {
        return "Untitled Conversation";
    }

    // Add title length validation (max 255 characters, truncate if longer)
    const title = sanitizedSummary.trim();
    if (title.length > 255) {
        return title.substring(0, 252) + "...";
    }

    return title;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateConversationTitle(conversationId: string, context: any): Promise<void> {
    try {
        // Call findRootNode() to get current root node
        const rootNode = await findRootNode(conversationId, context);

        let title: string;

        if (rootNode) {
            // If root node exists, call computeTitleFromSummary() with node.summary
            title = computeTitleFromSummary(rootNode.summary);
        } else {
            // If no root node, use "Untitled Conversation" as title
            title = "Untitled Conversation";
        }

        // Update conversation title using context.entities.Conversation.update()
        await context.entities.Conversation.update({
            where: { id: conversationId },
            data: { title },
        });
    } catch (error: unknown) {
        // Add try-catch block to log errors without throwing
        console.error("[TITLE_SERVICE] Error updating conversation title:", error as Error);
        // Don't throw to avoid breaking node operations
    }
}

// Export all functions from conversationTitleService
export { updateConversationTitle, findRootNode, computeTitleFromSummary };
export type { UpdateConversationTitleInput };
