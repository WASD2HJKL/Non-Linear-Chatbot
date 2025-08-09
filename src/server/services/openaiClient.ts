import OpenAI from "openai";

/**
 * Create and configure shared OpenAI client instance
 * @returns Configured OpenAI client instance
 * @throws Error if OPENAI_API_KEY environment variable is missing
 */
export function createSharedOpenAIClient(): OpenAI {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error("OPENAI_API_KEY environment variable is required");
    }

    return new OpenAI({
        apiKey: apiKey,
    });
}

// Export singleton instance for reuse
export const openai = createSharedOpenAIClient();
