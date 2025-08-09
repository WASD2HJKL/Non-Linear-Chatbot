import config from "../../config.js";

const OPENAI_PROVIDER_ID = "openai";

export function getValidOpenAIModels(): string[] {
    const openAIProvider = config.apiConfig.providers.find((p) => p.id === OPENAI_PROVIDER_ID);
    return openAIProvider?.models.map((m) => m.id) || [];
}

export function isValidOpenAIModel(modelId: string): boolean {
    return getValidOpenAIModels().includes(modelId);
}
