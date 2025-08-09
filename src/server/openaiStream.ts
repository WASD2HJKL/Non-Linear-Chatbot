import { pipeline, Transform } from "stream";
import { StreamRequestSchema } from "../shared/validation";
import { PrismaClient } from "@prisma/client";
import { createRateLimiter } from "./middleware/rateLimiter";
import { AuthenticatedRequest, WaspResponse, WaspContext } from "./types/express";
import { isValidOpenAIModel, getValidOpenAIModels } from "./services/configService";
import { openai } from "./services/openaiClient";

const prisma = new PrismaClient();

// Create CORS configuration function that reads WASP_WEB_CLIENT_URL environment variable
const getCorsOrigin = (): string => {
    const frontendUrl = process.env.WASP_WEB_CLIENT_URL;

    if (frontendUrl) {
        return frontendUrl;
    }

    // Fallback for development when WASP_WEB_CLIENT_URL is not set
    if (process.env.NODE_ENV !== "production") {
        return "http://localhost:3000";
    }

    throw new Error("WASP_WEB_CLIENT_URL environment variable must be set in production");
};

export const openaiStream = async (
    req: AuthenticatedRequest,
    res: WaspResponse,
    context: WaspContext,
): Promise<void | WaspResponse> => {
    // Handle OPTIONS preflight requests first
    if (req.method === "OPTIONS") {
        console.log("[CORS FIX] Handling OPTIONS preflight in openaiStream");
        const origin = req.headers.origin;
        const allowedOrigin = getCorsOrigin();

        console.log("[CORS FIX] Origin:", origin, "Allowed:", allowedOrigin);

        if (origin === allowedOrigin) {
            res.setHeader("Access-Control-Allow-Origin", origin);
            res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            res.setHeader("Access-Control-Allow-Credentials", "true");
        }

        return res.status(204).end();
    }

    // For POST requests, we have authentication from context
    const user = context.user;
    if (!user) {
        console.log("[OpenAI API] Authentication failed - no user found in context");
        return res.status(401).json({ error: "Unauthorized" });
    }

    // Set CORS headers for POST requests
    const origin = req.headers.origin;
    const allowedOrigin = getCorsOrigin();

    if (origin === allowedOrigin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    const parseResult = StreamRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
        console.error("[OpenAI API] Validation failed:", parseResult.error.issues);
        return res.status(400).json({
            error: "Invalid request body",
            details: parseResult.error.issues,
        });
    }

    const { messages, conversationId, model } = parseResult.data;

    if (!isValidOpenAIModel(model)) {
        const validModels = getValidOpenAIModels();
        return res.status(400).json({
            error: `Invalid model. Must be one of: ${validModels.join(", ")}`,
        });
    }

    const startTime = Date.now();

    try {
        console.log(`[OpenAI API] Stream request: user ${user.id}, ${messages.length} messages`);

        // Verify user owns the conversation if conversationId provided
        if (conversationId) {
            const conversation = await prisma.conversation.findFirst({
                where: {
                    id: conversationId,
                    userId: user.id,
                },
            });

            if (!conversation) {
                console.error(
                    `[OpenAI API] Unauthorized access attempt: user ${user.id} tried to access conversation ${conversationId}`,
                );
                return res.status(403).json({ error: "Forbidden: You do not have access to this conversation" });
            }
        }

        // Note: This endpoint is OpenAI-specific. For multi-provider support, create a new /api/ai/stream endpoint
        const stream = await openai.chat.completions.create({
            model, // Use model from request, validated against config
            messages,
            stream: true,
        });

        let accumulatedContent = "";

        const transformToNDJSON = new Transform({
            objectMode: true,
            transform(chunk: any, _encoding: any, callback: any) {
                const content = chunk.choices?.[0]?.delta?.content;
                if (content) {
                    accumulatedContent += content;
                    callback(null, JSON.stringify({ delta: content }) + "\n");
                } else {
                    callback();
                }
            },

            async flush(callback: any) {
                // Node creation will be handled by the client after receiving the complete response
                const duration = Date.now() - startTime;
                console.log(`[OpenAI API] Stream completed: ${duration}ms, ${accumulatedContent.length} chars`);
                callback();
            },
        });

        res.setHeader("Content-Type", "application/x-ndjson");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("Transfer-Encoding", "chunked");

        pipeline(stream, transformToNDJSON, res, (err: any) => {
            if (err) {
                const duration = Date.now() - startTime;
                console.error(`[OpenAI API] Stream pipeline error after ${duration}ms:`, err);
                // Node creation will be handled by the client
            }
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[OpenAI API] Request failed after ${duration}ms for user ${user.id}:`, error);
        res.status(500).json({ error: "Stream processing failed" });
    }
};

export const configureMiddleware = (config: Map<string, any>) => {
    console.log("[MIDDLEWARE DEBUG] configureMiddleware called with config:", Array.from(config.keys()));
    console.log("[MIDDLEWARE DEBUG] Environment WASP_WEB_CLIENT_URL:", process.env.WASP_WEB_CLIENT_URL);

    // Override Wasp's built-in CORS middleware completely with our own
    const corsMiddleware = (req: any, res: any, next: any) => {
        console.log("[CORS DEBUG] Custom CORS middleware executing for", req.method, req.url);
        const origin = req.headers.origin;
        const allowedOrigin = getCorsOrigin();

        console.log("[CORS DEBUG] Request origin:", JSON.stringify(origin));
        console.log("[CORS DEBUG] Allowed origin:", JSON.stringify(allowedOrigin));
        console.log("[CORS DEBUG] Request headers:", JSON.stringify(req.headers));

        // Set CORS headers for all requests from allowed origin
        if (origin === allowedOrigin) {
            console.log("[CORS DEBUG] Setting CORS headers for allowed origin");
            res.setHeader("Access-Control-Allow-Origin", origin);
            res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            res.setHeader("Access-Control-Allow-Credentials", "true");
        } else {
            console.log("[CORS DEBUG] Origin not allowed:", origin, "!==", allowedOrigin);
            // Still set some headers to help debug
            res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        }

        // Handle OPTIONS preflight requests
        if (req.method === "OPTIONS") {
            console.log("[CORS DEBUG] Handling OPTIONS preflight request, responding with 204");
            return res.status(204).end();
        }

        console.log("[CORS DEBUG] Continuing to next middleware");
        next();
    };

    // OPTIONS pre-handler that executes before auth middleware
    const optionsHandler = (req: any, res: any, next: any) => {
        console.log("[OPTIONS HANDLER] Request received:", req.method, req.url);

        if (req.method === "OPTIONS") {
            const origin = req.headers.origin;
            const allowedOrigin = getCorsOrigin();

            console.log("[OPTIONS HANDLER] Handling OPTIONS request");
            console.log("[OPTIONS HANDLER] Origin:", origin);
            console.log("[OPTIONS HANDLER] Allowed:", allowedOrigin);

            if (origin === allowedOrigin) {
                res.setHeader("Access-Control-Allow-Origin", origin);
                res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
                res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
                res.setHeader("Access-Control-Allow-Credentials", "true");
            }

            console.log("[OPTIONS HANDLER] Sending 204 response");
            return res.status(204).end();
        }

        console.log("[OPTIONS HANDLER] Not OPTIONS, continuing to next middleware");
        next();
    };

    // Apply rate limiting to the streaming endpoint
    const rateLimiter = createRateLimiter({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "3600000"), // 1 hour
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"), // 100 requests per window
        message: "Too many AI requests. Please try again later.",
    });

    // Wrap rate limiter to add debugging
    const debugRateLimiter = (req: any, res: any, next: any) => {
        console.log("[MIDDLEWARE DEBUG] Rate limiter middleware called for", req.method, req.url);
        return rateLimiter(req, res, next);
    };

    // Add OPTIONS handler as the first middleware
    config.set("optionsHandler", optionsHandler);
    // Replace Wasp's CORS with our own custom implementation
    config.set("cors", corsMiddleware);
    config.set("rateLimiter", debugRateLimiter);

    console.log("[MIDDLEWARE DEBUG] Final middleware config keys:", Array.from(config.keys()));
    return config;
};
