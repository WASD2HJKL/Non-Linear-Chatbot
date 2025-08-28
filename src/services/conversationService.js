import { deleteConversation } from "../client/operations/conversations";

/**
 * Service for managing conversation operations
 */
class ConversationService {
    constructor() {
        this.conversationCache = new Map();
    }

    /**
     * Delete a conversation (soft delete)
     * @param {string} conversationId - Conversation UUID to delete
     * @returns {Promise<void>}
     */
    async deleteConversation(conversationId) {
        try {
            await deleteConversation({ conversationId });

            // Remove from cache if present
            this.conversationCache.delete(conversationId);
        } catch (error) {
            console.error("Error deleting conversation:", error);
            throw error;
        }
    }

    /**
     * Clear cache for all conversations
     */
    clearAllCaches() {
        this.conversationCache.clear();
    }
}

export default new ConversationService();
