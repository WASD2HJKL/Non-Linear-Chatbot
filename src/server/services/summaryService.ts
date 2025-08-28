import { HttpError } from "wasp/server";
import summaryConfig from "../../summaryConfig.js";
import { isValidModelForProvider, isValidProvider } from "./configService";
import { createProviderClient } from "./openaiClient";
import { normalizeProviderError } from "./errorNormalizer";
import logger from "../utils/logger";

interface SummaryResult {
    summary: string;
    tokensUsed: number;
}

function validateSummaryConfig(): void {
    if (!isValidProvider(summaryConfig.defaultProvider)) {
        throw new HttpError(500, `Invalid summary provider: ${summaryConfig.defaultProvider}`);
    }

    if (!isValidModelForProvider(summaryConfig.defaultModel, summaryConfig.defaultProvider)) {
        throw new HttpError(
            500,
            `Invalid summary model: ${summaryConfig.defaultModel} for provider: ${summaryConfig.defaultProvider}`,
        );
    }
}

function getApiKeyForProvider(providerId: string): string {
    const conventionKey = `${providerId.toUpperCase()}_API_KEY`;
    const providerApiKey = process.env[conventionKey];

    if (!providerApiKey) {
        throw new HttpError(
            500,
            `API key not configured for summary generation. Please set ${conventionKey} environment variable.`,
        );
    }

    return providerApiKey;
}

export async function generateSummary(userMessage: string, assistantMessage: string): Promise<SummaryResult> {
    validateSummaryConfig();

    const messages = [
        { role: "system" as const, content: summaryConfig.prompt },
        { role: "user" as const, content: userMessage },
        { role: "assistant" as const, content: assistantMessage },
    ];

    const apiKey = getApiKeyForProvider(summaryConfig.defaultProvider);
    const client = createProviderClient(summaryConfig.defaultProvider, apiKey);

    try {
        if (process.env.NODE_ENV === "development") {
            logger.debug(`[SUMMARY] Provider: ${summaryConfig.defaultProvider}`);
            logger.debug(`[SUMMARY] Model: ${summaryConfig.defaultModel}`);
            logger.debug(`[SUMMARY] Max tokens: ${summaryConfig.maxTokens}`);
        }

        const start = Date.now();

        const response = await client.chat.completions.create({
            model: summaryConfig.defaultModel,
            messages,
            max_completion_tokens: summaryConfig.maxTokens,
            stream: false,
        });

        const summary = response.choices[0]?.message?.content?.trim() || "";
        const tokensUsed = response.usage?.total_tokens || 0;

        if (process.env.NODE_ENV === "development") {
            logger.info(`[SUMMARY] Generated in ${Date.now() - start}ms`);
            logger.debug(`[SUMMARY] Response: ${summary}`);
            logger.info(`[SUMMARY] Tokens used: ${tokensUsed}`);
        }

        return { summary, tokensUsed };
    } catch (error: unknown) {
        console.error("[SUMMARY] Provider error:", error);

        const normalizedError = normalizeProviderError(error, summaryConfig.defaultProvider);

        if (process.env.NODE_ENV === "development") {
            throw new HttpError(normalizedError.status, `Summary generation failed: ${normalizedError.message}`);
        } else {
            throw new HttpError(500, "Failed to generate summary. Please try again.");
        }
    }
}
