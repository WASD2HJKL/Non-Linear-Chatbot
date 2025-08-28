import { HttpError } from "wasp/server";
import type {
    CreateNode,
    UpdateNodePositions,
    UpdateNodeWidth,
    UpdateNodeExpanded,
    UpdateNodePinned,
    DeleteNode,
} from "wasp/server/operations";
import { generateSummary } from "../services/summaryService";
import { updateConversationTitle } from "../services/conversationTitleService";
import logger from "../utils/logger";
import crypto from "crypto";
import type { Node as DbNode } from "@prisma/client";

type CreateNodeInput = {
    conversationId: string;
    parentId: string | null;
    userMessage: string;
    assistantMessage: string;
    x: number;
    y: number;
    width?: number;
    isPinned?: boolean;
};

type UpdatePositionsInput = {
    updates: Array<{
        nodeId: string;
        x: number;
        y: number;
    }>;
};

type UpdateWidthInput = {
    updates: Array<{
        nodeId: string;
        width: number;
    }>;
};

type UpdateExpandedInput = {
    nodeId: string;
    expanded: boolean;
};

type UpdatePinnedInput = {
    nodeId: string;
    isPinned: boolean;
};

type DeleteNodeInput = {
    nodeId: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function computeNodePath(nodeId: string, parentId: string | null, context: any): Promise<string[]> {
    const path: string[] = [];
    let currentId = parentId;

    while (currentId) {
        const parentNode = (await context.entities.Node.findUnique({
            where: { id: currentId },
            select: { id: true, parentId: true },
        })) as { id: string; parentId: string | null } | null;

        if (!parentNode) {
            throw new HttpError(400, "Invalid parent reference");
        }

        path.unshift(parentNode.id);
        currentId = parentNode.parentId;
    }

    path.push(nodeId);
    return path;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createNode: CreateNode<CreateNodeInput, DbNode> = async (args, context: any) => {
    if (!context.user) throw new HttpError(401, "Unauthorized");

    const conversation = (await context.entities.Conversation.findFirst({
        where: { id: args.conversationId, userId: context.user.id },
    })) as { id: string } | null;

    if (!conversation) throw new HttpError(404, "Conversation not found");

    if (args.parentId) {
        const parentNode = (await context.entities.Node.findFirst({
            where: {
                id: args.parentId,
                conversationId: args.conversationId,
                userId: context.user.id,
            },
        })) as { id: string } | null;

        if (!parentNode) throw new HttpError(404, "Parent node not found");
    }

    const nodeId = crypto.randomUUID();
    const path = await computeNodePath(nodeId, args.parentId, context);

    // Generate summary before creating node
    const { summary, tokensUsed } = await generateSummary(args.userMessage, args.assistantMessage);

    if (process.env.NODE_ENV === "development") {
        logger.info(`[NODE_CREATE] Generated summary for node ${nodeId}, tokens used: ${tokensUsed}`);
    }

    const createdNode = (await context.entities.Node.create({
        data: {
            id: nodeId,
            conversationId: args.conversationId,
            userId: context.user.id,
            parentId: args.parentId,
            userMessage: args.userMessage,
            assistantMessage: args.assistantMessage,
            summary: summary,
            x: args.x,
            y: args.y,
            width: args.width || 250,
            isPinned: args.isPinned || false,
            path: path,
            visible: true,
        },
    })) as DbNode;

    // Update conversation title if this is a root node
    if (!args.parentId) {
        try {
            await updateConversationTitle(args.conversationId, context);
        } catch (error: unknown) {
            const err = error as Error;
            console.error("[NODE_CREATE] Error updating conversation title:", err);
            // Don't throw to prevent node creation failure
        }
    }

    return createdNode;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updateNodePositions: UpdateNodePositions<UpdatePositionsInput, DbNode[]> = async (args, context: any) => {
    if (!context.user) throw new HttpError(401, "Unauthorized");

    const nodeIds = args.updates.map((u) => u.nodeId);

    const nodes = (await context.entities.Node.findMany({
        where: {
            id: { in: nodeIds },
            userId: context.user.id,
        },
    })) as Array<{ id: string }>;

    if (nodes.length !== nodeIds.length) {
        throw new HttpError(404, "One or more nodes not found");
    }

    const updatePromises = args.updates.map((update) =>
        context.entities.Node.update({
            where: { id: update.nodeId },
            data: { x: update.x, y: update.y },
        }),
    );

    return (await Promise.all(updatePromises)) as DbNode[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updateNodeWidth: UpdateNodeWidth<UpdateWidthInput, DbNode[]> = async (args, context: any) => {
    if (!context.user) throw new HttpError(401, "Unauthorized");

    const nodeIds = args.updates.map((u) => u.nodeId);

    // Validate width values
    for (const update of args.updates) {
        if (update.width < 150 || update.width > 800) {
            throw new HttpError(400, `Width must be between 150 and 800 pixels. Got: ${update.width}`);
        }
    }

    const nodes = (await context.entities.Node.findMany({
        where: {
            id: { in: nodeIds },
            userId: context.user.id,
        },
    })) as Array<{ id: string }>;

    if (nodes.length !== nodeIds.length) {
        throw new HttpError(404, "One or more nodes not found");
    }

    const updatePromises = args.updates.map((update) =>
        context.entities.Node.update({
            where: { id: update.nodeId },
            data: { width: update.width },
        }),
    );

    return (await Promise.all(updatePromises)) as DbNode[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updateNodeExpanded: UpdateNodeExpanded<UpdateExpandedInput, DbNode> = async (args, context: any) => {
    if (!context.user) throw new HttpError(401, "Unauthorized");

    const node = (await context.entities.Node.findFirst({
        where: {
            id: args.nodeId,
            userId: context.user.id,
        },
    })) as DbNode | null;

    if (!node) {
        throw new HttpError(404, "Node not found");
    }

    return (await context.entities.Node.update({
        where: { id: args.nodeId },
        data: { expanded: args.expanded },
    })) as DbNode;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updateNodePinned: UpdateNodePinned<UpdatePinnedInput, DbNode> = async (args, context: any) => {
    if (!context.user) throw new HttpError(401, "Unauthorized");

    const node = (await context.entities.Node.findFirst({
        where: {
            id: args.nodeId,
            userId: context.user.id,
        },
    })) as DbNode | null;

    if (!node) {
        throw new HttpError(404, "Node not found");
    }

    return (await context.entities.Node.update({
        where: { id: args.nodeId },
        data: { isPinned: args.isPinned },
    })) as DbNode;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const deleteNode: DeleteNode<DeleteNodeInput, void> = async (args, context: any) => {
    if (!context.user) throw new HttpError(401, "Unauthorized");

    // Verify the node exists and belongs to the user
    const targetNode = (await context.entities.Node.findFirst({
        where: {
            id: args.nodeId,
            userId: context.user.id,
        },
    })) as { id: string; parentId: string | null; conversationId: string } | null;

    if (!targetNode) {
        throw new HttpError(404, "Node not found");
    }

    // Check if target is root node before deletion
    const isRootNode = targetNode.parentId === null;

    // Find all descendants using the path field
    // The path field contains an array of ancestor node IDs
    // Any node that has the target nodeId in its path is a descendant
    const allNodes = (await context.entities.Node.findMany({
        where: {
            conversationId: targetNode.conversationId,
            userId: context.user.id,
        },
        select: {
            id: true,
            path: true,
        },
    })) as Array<{ id: string; path?: unknown }>;

    // Identify all descendants by checking if target nodeId is in their path
    const nodeIdsToDelete = [args.nodeId]; // Include the target node itself

    for (const node of allNodes) {
        if (node.path && Array.isArray(node.path)) {
            // Check if the target node ID is in this node's path
            if (node.path.includes(args.nodeId)) {
                nodeIdsToDelete.push(node.id);
            }
        }
    }

    // Batch update all identified nodes to set visible to false
    await context.entities.Node.updateMany({
        where: {
            id: { in: nodeIdsToDelete },
            userId: context.user.id,
        },
        data: {
            visible: false,
        },
    });

    // Update conversation title if root node was deleted
    if (isRootNode) {
        try {
            await updateConversationTitle(targetNode.conversationId, context);
        } catch (error: unknown) {
            const err = error as Error;
            console.error("[NODE_DELETE] Error updating conversation title:", err);
            // Don't throw to prevent deletion failure
        }
    }

    if (process.env.NODE_ENV === "development") {
        logger.info(`[NODE_DELETE] Soft deleted node ${args.nodeId} and ${nodeIdsToDelete.length - 1} descendants`);
    }
};
