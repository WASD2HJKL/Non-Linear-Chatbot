import { HttpError } from "wasp/server";
import type { CreateConversation, UpdateLastActiveNodeId, DeleteConversation } from "wasp/server/operations";
import type { Conversation } from "@prisma/client";
import { generateUUID } from "../../utils/uuid";
import { sanitizeContent } from "../utils/sanitizer";

type CreateConversationInput = { title?: string };

type UpdateLastActiveNodeIdInput = {
    conversationId: string;
    lastActiveNodeId: string | null;
};

type DeleteConversationInput = {
    conversationId: string;
};

export const createConversation: CreateConversation<CreateConversationInput, Conversation> = async (args, context) => {
    if (!context.user) throw new HttpError(401, "Unauthorized");

    return await context.entities.Conversation.create({
        data: {
            id: generateUUID(),
            userId: context.user.id,
            title: args.title ? sanitizeContent(args.title) : args.title,
        },
    });
};

export const updateLastActiveNodeId: UpdateLastActiveNodeId<UpdateLastActiveNodeIdInput, void> = async (
    args,
    context,
) => {
    if (!context.user) throw new HttpError(401, "Unauthorized");

    const conversation = await context.entities.Conversation.findFirst({
        where: { id: args.conversationId, userId: context.user.id },
    });

    if (!conversation) throw new HttpError(404, "Conversation not found");

    // If lastActiveNodeId is provided, validate it exists and belongs to this conversation
    if (args.lastActiveNodeId) {
        const node = await context.entities.Node.findFirst({
            where: {
                id: args.lastActiveNodeId,
                conversationId: args.conversationId,
                userId: context.user.id,
            },
        });

        if (!node) throw new HttpError(400, "Invalid node reference");
    }

    await context.entities.Conversation.update({
        where: { id: args.conversationId },
        data: { lastActiveNodeId: args.lastActiveNodeId },
    });
};

export const deleteConversation: DeleteConversation<DeleteConversationInput, void> = async (args, context) => {
    if (!context.user) throw new HttpError(401, "Unauthorized");

    // Verify the conversation exists and belongs to the user
    const conversation = await context.entities.Conversation.findFirst({
        where: {
            id: args.conversationId,
            userId: context.user.id,
        },
    });

    if (!conversation) {
        throw new HttpError(404, "Conversation not found");
    }

    // Soft delete by setting visible to false and updating updatedAt
    await context.entities.Conversation.update({
        where: {
            id: args.conversationId,
        },
        data: {
            visible: false,
        },
    });
};
