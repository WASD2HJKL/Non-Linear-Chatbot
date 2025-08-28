import { HttpError } from "wasp/server";
import type { GetConversationNodes } from "wasp/server/operations";
import type { Node } from "@prisma/client";

type GetNodesInput = {
    conversationId: string;
};

export const getConversationNodes: GetConversationNodes<GetNodesInput, Node[]> = async (args, context) => {
    if (!context.user) throw new HttpError(401, "Unauthorized");

    const conversation = await context.entities.Conversation.findFirst({
        where: { id: args.conversationId, userId: context.user.id },
    });

    if (!conversation) throw new HttpError(404, "Conversation not found");

    return await context.entities.Node.findMany({
        where: {
            conversationId: args.conversationId,
            userId: context.user.id,
            visible: true,
        },
        orderBy: { createdAt: "asc" },
    });
};
