import { pipeline, Transform } from "stream";
import type { TransformCallback } from "stream";
import { StreamRequestSchema } from "../shared/validation";
import { PrismaClient } from "@prisma/client";
import { createRateLimiter } from "./middleware/rateLimiter";
import { AuthenticatedRequest, WaspResponse, WaspContext } from "./types/express";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { isValidModelForProvider, isValidProvider } from "./services/configService";
import { createProviderClient } from "./services/openaiClient";
import { normalizeProviderError } from "./services/errorNormalizer";
import logger from "./utils/logger";

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

export const aiStream = async (
    req: AuthenticatedRequest,
    res: WaspResponse,
    context: WaspContext,
): Promise<void | WaspResponse> => {
    // Handle OPTIONS preflight requests first
    if (req.method === "OPTIONS") {
        logger.debug("[CORS FIX] Handling OPTIONS preflight in aiStream");
        const origin = req.headers.origin;
        const allowedOrigin = getCorsOrigin();

        logger.debug(`[CORS FIX] Origin: ${origin}, Allowed: ${allowedOrigin}`);

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
        logger.warn("[OpenAI API] Authentication failed - no user found in context");
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

    const { messages, conversationId, model, provider } = parseResult.data;

    // Default to OpenAI for backward compatibility
    const selectedProvider = provider || "openai";

    // Validate provider exists
    if (!isValidProvider(selectedProvider)) {
        return res.status(400).json({
            error: `Invalid provider: ${selectedProvider}`,
        });
    }

    // Validate model for the selected provider
    if (!isValidModelForProvider(model, selectedProvider)) {
        return res.status(400).json({
            error: `Invalid model '${model}' for provider '${selectedProvider}'`,
        });
    }

    const startTime = Date.now();

    try {
        logger.info(
            `[AI API] Request details - User: ${user.id}, Messages: ${messages.length}, Provider: ${selectedProvider}`,
        );

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
                    `[AI API] Unauthorized access attempt: user ${user.id} tried to access conversation ${conversationId}`,
                );
                return res.status(403).json({ error: "Forbidden: You do not have access to this conversation" });
            }
        }

        // Get API key for the selected provider using convention-based lookup
        const getApiKeyForProvider = (providerId: string): string | undefined => {
            const conventionKey = `${providerId.toUpperCase()}_API_KEY`;
            const providerApiKey = process.env[conventionKey];

            // Fallback to OPENAI_API_KEY for backward compatibility
            return providerApiKey || process.env.OPENAI_API_KEY;
        };

        const apiKey = getApiKeyForProvider(selectedProvider);
        if (!apiKey) {
            const expectedKey = `${selectedProvider.toUpperCase()}_API_KEY`;
            return res.status(500).json({
                error: `API key not configured for provider '${selectedProvider}'. Please set ${expectedKey} or OPENAI_API_KEY environment variable.`,
            });
        }

        // Create provider-specific client
        const client = createProviderClient(selectedProvider, apiKey);

        // Create chat completion stream
        logger.debug(`[STREAM DEBUG] Creating stream for provider: ${selectedProvider}, model: ${model}`);
        const stream = await client.chat.completions.create({
            model, // Use model from request, validated against provider config
            messages,
            stream: true,
        });
        logger.debug(
            `[STREAM DEBUG] Stream created successfully, type: ${typeof stream}, constructor: ${stream.constructor.name}`,
        );

        let accumulatedContent = "";

        const transformToNDJSON = new Transform({
            objectMode: true,
            transform(chunk: unknown, _encoding: unknown, callback: TransformCallback) {
                logger.debug(`[TRANSFORM DEBUG] Provider: ${selectedProvider}, Raw chunk: ${JSON.stringify(chunk)}`);
                const c = chunk as { choices?: Array<{ delta?: { content?: string } }> };
                const content = c.choices?.[0]?.delta?.content;
                logger.debug(`[TRANSFORM DEBUG] Extracted content: ${JSON.stringify(content)}`);
                if (content) {
                    accumulatedContent += content;
                    const ndjsonLine = JSON.stringify({ delta: content }) + "\n";
                    logger.debug(`[TRANSFORM DEBUG] Sending NDJSON: ${JSON.stringify(ndjsonLine)}`);
                    callback(null, ndjsonLine);
                } else {
                    logger.debug("[TRANSFORM DEBUG] No content found, skipping chunk");
                    callback();
                }
            },

            flush(callback: TransformCallback) {
                // Node creation will be handled by the client after receiving the complete response
                const duration = Date.now() - startTime;
                logger.info(`[AI API] Stream completed: ${duration}ms, ${accumulatedContent.length} chars`);
                callback();
            },
        });

        res.setHeader("Content-Type", "application/x-ndjson");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("Transfer-Encoding", "chunked");

        // Handle different stream types for different providers
        if (selectedProvider === "gemini") {
            logger.debug("[STREAM DEBUG] Using async iterator for Gemini");
            // Use async iterator for Gemini
            try {
                for await (const chunk of stream as AsyncIterable<unknown>) {
                    logger.debug(`[STREAM DEBUG] Gemini chunk: ${JSON.stringify(chunk)}`);
                    const c = chunk as { choices?: Array<{ delta?: { content?: string } }> };
                    const content = c.choices?.[0]?.delta?.content;
                    if (content) {
                        accumulatedContent += content;
                        const ndjsonLine = JSON.stringify({ delta: content }) + "\n";
                        res.write(ndjsonLine);
                    }
                }
                res.end();
                const duration = Date.now() - startTime;
                logger.info(`[AI API] Gemini stream completed: ${duration}ms, ${accumulatedContent.length} chars`);
            } catch (err: unknown) {
                const e = err as Error;
                console.error(`[AI API] Gemini stream error:`, e);
                res.status(500).json({ error: "Streaming failed" });
            }
        } else {
            // Use pipeline for OpenAI and other providers
            logger.debug(`[STREAM DEBUG] Using pipeline for provider: ${selectedProvider}`);
            pipeline(stream, transformToNDJSON, res, (err: unknown) => {
                if (err) {
                    const duration = Date.now() - startTime;
                    const e = err as Error;
                    console.error(`[AI API] Stream pipeline error after ${duration}ms:`, e);
                    // Node creation will be handled by the client
                }
            });
        }
    } catch (error: unknown) {
        const duration = Date.now() - startTime;
        console.error(
            `[AI API] Request failed after ${duration}ms for user ${user.id} with provider ${selectedProvider}:`,
            error as Error,
        );

        // Normalize error for consistent client handling
        const normalizedError = normalizeProviderError(error, selectedProvider);

        res.status(normalizedError.status).json({
            error: normalizedError.message,
            code: normalizedError.code,
            type: normalizedError.type,
            provider: normalizedError.provider,
            isRetryable: normalizedError.isRetryable,
        });
    }
};

export const configureMiddleware = (config: Map<string, RequestHandler>) => {
    logger.debug(`[MIDDLEWARE DEBUG] configureMiddleware called with config: ${Array.from(config.keys()).join(", ")}`);
    logger.debug(`[MIDDLEWARE DEBUG] Environment WASP_WEB_CLIENT_URL: ${process.env.WASP_WEB_CLIENT_URL}`);

    // Override Wasp's built-in CORS middleware completely with our own
    const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
        logger.debug(`[CORS DEBUG] Custom CORS middleware executing for ${req.method} ${req.url}`);
        const origin = req.headers.origin;
        const allowedOrigin = getCorsOrigin();

        logger.debug(`[CORS DEBUG] Request origin: ${JSON.stringify(origin)}`);
        logger.debug(`[CORS DEBUG] Allowed origin: ${JSON.stringify(allowedOrigin)}`);
        logger.debug(`[CORS DEBUG] Request headers: ${JSON.stringify(req.headers)}`);

        // Set CORS headers for all requests from allowed origin
        if (origin === allowedOrigin) {
            logger.debug("[CORS DEBUG] Setting CORS headers for allowed origin");
            res.setHeader("Access-Control-Allow-Origin", origin);
            res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            res.setHeader("Access-Control-Allow-Credentials", "true");
        } else {
            logger.warn(`[CORS DEBUG] Origin not allowed: ${origin} !== ${allowedOrigin}`);
            // Still set some headers to help debug
            res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        }

        // Handle OPTIONS preflight requests
        if (req.method === "OPTIONS") {
            logger.debug("[CORS DEBUG] Handling OPTIONS preflight request, responding with 204");
            return res.status(204).end();
        }

        logger.debug("[CORS DEBUG] Continuing to next middleware");
        next();
    };

    // OPTIONS pre-handler that executes before auth middleware
    const optionsHandler = (req: Request, res: Response, next: NextFunction) => {
        logger.debug(`[OPTIONS HANDLER] Request received: ${req.method} ${req.url}`);

        if (req.method === "OPTIONS") {
            const origin = req.headers.origin;
            const allowedOrigin = getCorsOrigin();

            logger.debug("[OPTIONS HANDLER] Handling OPTIONS request");
            logger.debug(`[OPTIONS HANDLER] Origin: ${origin}`);
            logger.debug(`[OPTIONS HANDLER] Allowed: ${allowedOrigin}`);

            if (origin === allowedOrigin) {
                res.setHeader("Access-Control-Allow-Origin", origin);
                res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
                res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
                res.setHeader("Access-Control-Allow-Credentials", "true");
            }

            logger.debug("[OPTIONS HANDLER] Sending 204 response");
            return res.status(204).end();
        }

        logger.debug("[OPTIONS HANDLER] Not OPTIONS, continuing to next middleware");
        next();
    };

    // Apply rate limiting to the streaming endpoint
    const rateLimiter = createRateLimiter({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "3600000"), // 1 hour
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"), // 100 requests per window
        message: "Too many AI requests. Please try again later.",
    });

    // Wrap rate limiter to add debugging
    const debugRateLimiter = (req: Request, res: Response, next: NextFunction) => {
        logger.debug(`[MIDDLEWARE DEBUG] Rate limiter middleware called for ${req.method} ${req.url}`);
        return rateLimiter(req, res, next);
    };

    // Add OPTIONS handler as the first middleware
    config.set("optionsHandler", optionsHandler);
    // Replace Wasp's CORS with our own custom implementation
    config.set("cors", corsMiddleware);
    config.set("rateLimiter", debugRateLimiter);

    logger.debug(`[MIDDLEWARE DEBUG] Final middleware config keys: ${Array.from(config.keys()).join(", ")}`);
    return config;
};
