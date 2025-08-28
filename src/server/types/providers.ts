export interface ProviderConfig {
    id: string;
    name: string;
    url: string;
    timeout: number;
    retries: number;
    models: ModelConfig[];
}

export interface ModelConfig {
    id: string;
    name: string;
}

export interface NormalizedError {
    provider: string;
    status: number;
    code: string;
    type: string;
    message: string;
    retryAfter?: number;
    isRetryable: boolean;
    raw?: unknown;
}

export type ClientCacheKey = string; // Format: "${providerId}:${baseURL}:${hashedApiKey}"

import type OpenAI from "openai";

export interface ClientCacheEntry {
    client: OpenAI; // OpenAI client instance
    timestamp: number;
    providerId: string;
    baseURL: string;
}

export class ConfigurationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ConfigurationError";
    }
}

export class AuthenticationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AuthenticationError";
    }
}
