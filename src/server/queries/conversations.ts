import { HttpError } from "wasp/server";
import type { GetConversations, GetConversation } from "wasp/server/operations";

export const getConversations: GetConversations<void, any> = async (args, context) => {
    if (!context.user) return [];

    return await context.entities.Conversation.findMany({
        where: { userId: context.user.id },
        include: {
            nodes: {
                orderBy: { createdAt: "asc" },
                take: 5,
            },
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
    });
};

export const getConversation: GetConversation<{ id: string }, any> = async (args, context) => {
    if (!context.user) throw new HttpError(401, "Unauthorized");

    const conversation = await context.entities.Conversation.findFirst({
        where: { id: args.id, userId: context.user.id },
        include: {
            nodes: {
                orderBy: { createdAt: "asc" },
            },
        },
    });

    if (!conversation) throw new HttpError(404, "Conversation not found");
    return conversation;
};
