function collectMetadata(user, conversationTree, exportSettings) {
    const now = new Date();

    // Extract user information if settings allow and user exists
    let userInfo = "Anonymous";
    if (exportSettings.includeUserInfo && user) {
        if (user.username) {
            userInfo = user.username;
        } else if (user.email) {
            userInfo = user.email;
        } else if (user.firstName || user.lastName) {
            userInfo = `${user.firstName || ""} ${user.lastName || ""}`.trim();
        }
    }

    // Calculate conversation statistics
    const nodeCount = Object.keys(conversationTree).length - 1; // Exclude root
    let messageCount = 0;
    let earliestTimestamp = null;

    Object.values(conversationTree).forEach((branch) => {
        messageCount += branch.messages.length;

        // Find earliest message timestamp
        branch.messages.forEach((message) => {
            if (message.createdAt) {
                const messageTime = new Date(message.createdAt);
                if (!earliestTimestamp || messageTime < earliestTimestamp) {
                    earliestTimestamp = messageTime;
                }
            }
        });
    });

    // Extract conversation title if available
    let conversationTitle = "Conversation Map";
    if (exportSettings.includeConversationTitle) {
        // Try to find title from the first user message or use a default
        const rootBranch = conversationTree.root;
        if (rootBranch && rootBranch.messages.length > 0) {
            const firstUserMessage = rootBranch.messages.find((m) => m.role === "user");
            if (firstUserMessage && firstUserMessage.content) {
                // Use first 50 characters of first user message as title
                conversationTitle = firstUserMessage.content.substring(0, 50).trim();
                if (firstUserMessage.content.length > 50) {
                    conversationTitle += "...";
                }
            }
        }
    }

    // Format timestamps
    const exportTimestamp = exportSettings.includeTimestamps ? now.toLocaleString() : null;

    const creationTimestamp =
        exportSettings.includeTimestamps && earliestTimestamp ? earliestTimestamp.toLocaleString() : null;

    // Build metadata object
    const metadata = {
        userInfo: exportSettings.includeUserInfo ? userInfo : null,
        conversationTitle: exportSettings.includeConversationTitle ? conversationTitle : null,
        nodeCount,
        messageCount,
        exportTimestamp,
        creationTimestamp,
        exportedBy: userInfo,
        generatedAt: now.toISOString(),
    };

    return metadata;
}

export default {
    collectMetadata,
};
