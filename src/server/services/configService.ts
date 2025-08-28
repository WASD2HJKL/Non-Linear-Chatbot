import config from "../../config.js";
import { ProviderConfig, ConfigurationError } from "../types/providers";

/**
 * Get provider configuration by ID
 * @param providerId Provider identifier
 * @returns Provider configuration
 * @throws ConfigurationError if provider not found
 */
export function getProviderConfig(providerId: string): ProviderConfig {
    const providers = config.apiConfig.providers as ProviderConfig[];
    const provider = providers.find((p) => p.id === providerId);
    if (!provider) {
        throw new ConfigurationError(`Provider not found: ${providerId}`);
    }
    return provider;
}

/**
 * Get valid models for a specific provider
 * @param providerId Provider identifier
 * @returns Array of model IDs for the provider
 */
export function getValidModelsForProvider(providerId: string): string[] {
    try {
        const provider = getProviderConfig(providerId);
        return provider.models.map((m) => m.id);
    } catch {
        return [];
    }
}

/**
 * Validate if model exists for specific provider
 * @param modelId Model identifier to validate
 * @param providerId Provider to check against
 * @returns Boolean indicating if model is valid for provider
 */
export function isValidModelForProvider(modelId: string, providerId: string): boolean {
    const validModels = getValidModelsForProvider(providerId);
    return validModels.includes(modelId);
}

// Legacy OpenAI-specific functions for backward compatibility
export function getValidOpenAIModels(): string[] {
    return getValidModelsForProvider("openai");
}

export function isValidOpenAIModel(modelId: string): boolean {
    return isValidModelForProvider(modelId, "openai");
}

/**
 * Get all available providers
 * @returns Array of provider configurations
 */
export function getAllProviders(): ProviderConfig[] {
    return config.apiConfig.providers as ProviderConfig[];
}

/**
 * Check if provider exists in configuration
 * @param providerId Provider identifier
 * @returns Boolean indicating if provider exists
 */
export function isValidProvider(providerId: string): boolean {
    const providers = config.apiConfig.providers as ProviderConfig[];
    return providers.some((p) => p.id === providerId);
}
