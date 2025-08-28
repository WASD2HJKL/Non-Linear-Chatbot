import OpenAI from "openai";
import crypto from "crypto";
import config from "../../config.js";
import {
    ProviderConfig,
    ClientCacheKey,
    ClientCacheEntry,
    ConfigurationError,
    AuthenticationError,
} from "../types/providers";

// In-memory cache for client instances (max 50 clients with LRU eviction)
const clientCache = new Map<ClientCacheKey, ClientCacheEntry>();
const MAX_CACHE_SIZE = 50;

/**
 * Generate cache key for client caching
 * @param providerId Provider identifier
 * @param baseURL Base URL for the provider
 * @param apiKey API key for authentication
 * @returns Cache key string
 */
function generateCacheKey(providerId: string, baseURL: string, apiKey: string): ClientCacheKey {
    const hashedApiKey = crypto.createHash("sha256").update(apiKey).digest("hex").substring(0, 16);
    return `${providerId}:${baseURL}:${hashedApiKey}`;
}

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
 * Evict oldest cache entry when cache is full
 */
function evictOldestCacheEntry(): void {
    if (clientCache.size === 0) return;

    let oldestKey: ClientCacheKey | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of clientCache.entries()) {
        if (entry.timestamp < oldestTimestamp) {
            oldestTimestamp = entry.timestamp;
            oldestKey = key;
        }
    }

    if (oldestKey) {
        clientCache.delete(oldestKey);
    }
}

/**
 * Factory function to create OpenAI SDK clients configured for specific providers
 * @param providerId Provider identifier from config
 * @param apiKey API key for authentication
 * @returns Configured OpenAI client instance
 * @throws ConfigurationError if provider not found
 * @throws AuthenticationError if API key invalid
 */
export function createProviderClient(providerId: string, apiKey: string): OpenAI {
    if (!apiKey) {
        throw new AuthenticationError("API key is required");
    }

    const providerConfig = getProviderConfig(providerId);
    const cacheKey = generateCacheKey(providerId, providerConfig.url, apiKey);

    // Check cache first
    const cachedEntry = clientCache.get(cacheKey);
    if (cachedEntry) {
        // Update timestamp for LRU
        cachedEntry.timestamp = Date.now();
        return cachedEntry.client;
    }

    // Create new client with provider-specific configuration
    const client = new OpenAI({
        apiKey: apiKey,
        baseURL: providerConfig.url,
        timeout: providerConfig.timeout || 30000,
        maxRetries: providerConfig.retries || 3,
    });

    // Evict oldest entry if cache is full
    if (clientCache.size >= MAX_CACHE_SIZE) {
        evictOldestCacheEntry();
    }

    // Cache the new client
    clientCache.set(cacheKey, {
        client,
        timestamp: Date.now(),
        providerId,
        baseURL: providerConfig.url,
    });

    return client;
}

/**
 * Get cached client count (for monitoring/debugging)
 * @returns Number of cached clients
 */
export function getCachedClientCount(): number {
    return clientCache.size;
}

/**
 * Clear all cached clients (for testing/cleanup)
 */
export function clearClientCache(): void {
    clientCache.clear();
}
