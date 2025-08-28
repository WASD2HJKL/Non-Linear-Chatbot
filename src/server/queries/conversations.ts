import { HttpError } from "wasp/server";
import type { GetConversations, GetConversation } from "wasp/server/operations";
import type { Conversation, Node } from "@prisma/client";

type ConversationWithNodes = Conversation & { nodes: Node[] };

export const getConversations: GetConversations<void, ConversationWithNodes[]> = async (_args, context) => {
    if (!context.user) return [];

    return await context.entities.Conversation.findMany({
        where: { userId: context.user.id, visible: true },
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

export const getConversation: GetConversation<{ id: string }, ConversationWithNodes> = async (args, context) => {
    if (!context.user) throw new HttpError(401, "Unauthorized");

    const conversation = await context.entities.Conversation.findFirst({
        where: { id: args.id, userId: context.user.id, visible: true },
        include: {
            nodes: {
                orderBy: { createdAt: "asc" },
            },
        },
    });

    if (!conversation) throw new HttpError(404, "Conversation not found");
    return conversation;
};
