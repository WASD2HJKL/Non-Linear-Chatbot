import { HttpError } from "wasp/server";
import type {
    CreateNode,
    UpdateNodePositions,
    UpdateNodeWidth,
    UpdateNodeExpanded,
    UpdateNodePinned,
} from "wasp/server/operations";
import { openai } from "../services/openaiClient";
import { isValidOpenAIModel } from "../services/configService";

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

async function computeNodePath(nodeId: string, parentId: string | null, context: any): Promise<string[]> {
    const path: string[] = [];
    let currentId = parentId;

    while (currentId) {
        const parentNode = await context.entities.Node.findUnique({
            where: { id: currentId },
            select: { id: true, parentId: true },
        });

        if (!parentNode) {
            throw new HttpError(400, "Invalid parent reference");
        }

        path.unshift(parentNode.id);
        currentId = parentNode.parentId;
    }

    path.push(nodeId);
    return path;
}

async function generateSummary(
    userMessage: string,
    assistantMessage: string,
): Promise<{ summary: string; tokensUsed: number }> {
    const model = process.env.SUMMARY_MODEL || "gpt-4.1-mini";
    const maxTokens = parseInt(process.env.SUMMARY_TOKEN || "100");
    const systemPrompt = process.env.SUMMARY_PROMPT || "Summarize the following conversation:";

    // Validate model
    if (!isValidOpenAIModel(model)) {
        throw new HttpError(500, `Invalid SUMMARY_MODEL: ${model}`);
    }

    const messages = [
        { role: "system" as const, content: systemPrompt },
        { role: "user" as const, content: userMessage },
        { role: "assistant" as const, content: assistantMessage },
    ];

    try {
        if (process.env.NODE_ENV === "development") {
            console.log("[SUMMARY] Model:", model);
            console.log("[SUMMARY] Prompt:", systemPrompt);
            console.log("[SUMMARY] Max tokens:", maxTokens);
        }

        const start = Date.now();
        const response = await openai.chat.completions.create({
            model,
            messages,
            max_completion_tokens: maxTokens,
            stream: false,
        });

        const summary = response.choices[0]?.message?.content?.trim() || "";
        const tokensUsed = response.usage?.total_tokens || 0;

        if (process.env.NODE_ENV === "development") {
            console.log(`[SUMMARY] Generated in ${Date.now() - start}ms`);
            console.log("[SUMMARY] Response:", summary);
            console.log("[SUMMARY] Tokens used:", tokensUsed);
        }

        return { summary, tokensUsed };
    } catch (error: any) {
        console.error("[SUMMARY] OpenAI error:", error);

        if (process.env.NODE_ENV === "development") {
            throw new HttpError(500, `OpenAI error: ${error.message}`);
        } else {
            throw new HttpError(500, "Failed to create node. Please try again.");
        }
    }
}

export const createNode: CreateNode<CreateNodeInput, any> = async (args, context) => {
    if (!context.user) throw new HttpError(401, "Unauthorized");

    const conversation = await context.entities.Conversation.findFirst({
        where: { id: args.conversationId, userId: context.user.id },
    });

    if (!conversation) throw new HttpError(404, "Conversation not found");

    if (args.parentId) {
        const parentNode = await context.entities.Node.findFirst({
            where: {
                id: args.parentId,
                conversationId: args.conversationId,
                userId: context.user.id,
            },
        });

        if (!parentNode) throw new HttpError(404, "Parent node not found");
    }

    const nodeId = crypto.randomUUID();
    const path = await computeNodePath(nodeId, args.parentId, context);

    // Generate summary before creating node
    const { summary, tokensUsed } = await generateSummary(args.userMessage, args.assistantMessage);

    if (process.env.NODE_ENV === "development") {
        console.log(`[NODE_CREATE] Generated summary for node ${nodeId}, tokens used: ${tokensUsed}`);
    }

    return await context.entities.Node.create({
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
    });
};

export const updateNodePositions: UpdateNodePositions<UpdatePositionsInput, any> = async (args, context) => {
    if (!context.user) throw new HttpError(401, "Unauthorized");

    const nodeIds = args.updates.map((u) => u.nodeId);

    const nodes = await context.entities.Node.findMany({
        where: {
            id: { in: nodeIds },
            userId: context.user.id,
        },
    });

    if (nodes.length !== nodeIds.length) {
        throw new HttpError(404, "One or more nodes not found");
    }

    const updatePromises = args.updates.map((update) =>
        context.entities.Node.update({
            where: { id: update.nodeId },
            data: { x: update.x, y: update.y },
        }),
    );

    return await Promise.all(updatePromises);
};

export const updateNodeWidth: UpdateNodeWidth<UpdateWidthInput, any> = async (args, context) => {
    if (!context.user) throw new HttpError(401, "Unauthorized");

    const nodeIds = args.updates.map((u) => u.nodeId);

    // Validate width values
    for (const update of args.updates) {
        if (update.width < 150 || update.width > 800) {
            throw new HttpError(400, `Width must be between 150 and 800 pixels. Got: ${update.width}`);
        }
    }

    const nodes = await context.entities.Node.findMany({
        where: {
            id: { in: nodeIds },
            userId: context.user.id,
        },
    });

    if (nodes.length !== nodeIds.length) {
        throw new HttpError(404, "One or more nodes not found");
    }

    const updatePromises = args.updates.map((update) =>
        context.entities.Node.update({
            where: { id: update.nodeId },
            data: { width: update.width },
        }),
    );

    return await Promise.all(updatePromises);
};

export const updateNodeExpanded: UpdateNodeExpanded<UpdateExpandedInput, any> = async (args, context) => {
    if (!context.user) throw new HttpError(401, "Unauthorized");

    const node = await context.entities.Node.findFirst({
        where: {
            id: args.nodeId,
            userId: context.user.id,
        },
    });

    if (!node) {
        throw new HttpError(404, "Node not found");
    }

    return await context.entities.Node.update({
        where: { id: args.nodeId },
        data: { expanded: args.expanded },
    });
};

export const updateNodePinned: UpdateNodePinned<UpdatePinnedInput, any> = async (args, context) => {
    if (!context.user) throw new HttpError(401, "Unauthorized");

    const node = await context.entities.Node.findFirst({
        where: {
            id: args.nodeId,
            userId: context.user.id,
        },
    });

    if (!node) {
        throw new HttpError(404, "Node not found");
    }

    return await context.entities.Node.update({
        where: { id: args.nodeId },
        data: { isPinned: args.isPinned },
    });
};
