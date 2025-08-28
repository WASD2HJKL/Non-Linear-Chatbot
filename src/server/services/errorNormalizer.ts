import { NormalizedError } from "../types/providers";

type ApiErrorLike = {
    status?: number;
    message?: string;
    headers?: Record<string, string | number | undefined>;
    response?: {
        status?: number;
        statusText?: string;
        data?: { error?: string };
    };
    code?: string;
    constructor?: { name?: string };
};

function asApiError(e: unknown): e is ApiErrorLike {
    return typeof e === "object" && e !== null;
}

/**
 * Normalize provider-specific errors to standardized format
 * @param error Raw error from provider API
 * @param providerId Provider that generated the error
 * @returns NormalizedError object with standardized fields
 */
export function normalizeProviderError(error: unknown, providerId: string): NormalizedError {
    // Default normalized error structure
    const normalized: NormalizedError = {
        provider: providerId,
        status: 500,
        code: "server_error",
        type: "error",
        message: "An unexpected error occurred",
        isRetryable: false,
        raw: error,
    };

    // Handle OpenAI SDK errors
    let err: ApiErrorLike | undefined;
    if (asApiError(error)) {
        err = error;
    } else {
        err = undefined;
    }

    if (err && (err.constructor?.name === "APIError" || typeof err.status === "number")) {
        normalized.status = err.status || 500;
        normalized.message = err.message || "API error occurred";

        // Map OpenAI error codes to normalized codes
        switch (err.status) {
            case 400:
                normalized.code = "invalid_request";
                normalized.type = "client_error";
                normalized.isRetryable = false;
                break;
            case 401:
                normalized.code = "invalid_api_key";
                normalized.type = "authentication_error";
                normalized.isRetryable = false;
                break;
            case 403:
                normalized.code = "forbidden";
                normalized.type = "authorization_error";
                normalized.isRetryable = false;
                break;
            case 404:
                normalized.code = "model_not_found";
                normalized.type = "client_error";
                normalized.isRetryable = false;
                break;
            case 429:
                normalized.code = "rate_limit_exceeded";
                normalized.type = "rate_limit_error";
                normalized.isRetryable = true;
                // Extract retry-after header if available
                if (err.headers && err.headers["retry-after"] !== undefined) {
                    const ra = err.headers["retry-after"];
                    const v = typeof ra === "string" ? parseInt(ra, 10) : Number(ra);
                    if (!Number.isNaN(v)) normalized.retryAfter = v;
                }
                break;
            case 500:
            case 502:
            case 503:
            case 504:
                normalized.code = "server_error";
                normalized.type = "server_error";
                normalized.isRetryable = true;
                break;
            default:
                normalized.code = "unknown_error";
                normalized.type = "error";
                normalized.isRetryable = (err.status ?? 0) >= 500;
        }
    }
    // Handle Hugging Face specific error patterns
    else if (providerId === "huggingface" && err?.response) {
        normalized.status = err.response.status || 500;
        normalized.message = err.response.data?.error || err.message || "Hugging Face API error";

        // Map Hugging Face error patterns
        if (err.response.status === 401) {
            normalized.code = "invalid_api_key";
            normalized.type = "authentication_error";
            normalized.isRetryable = false;
        } else if (err.response.status === 429) {
            normalized.code = "rate_limit_exceeded";
            normalized.type = "rate_limit_error";
            normalized.isRetryable = true;
        } else if ((err.response.status ?? 0) >= 500) {
            normalized.code = "server_error";
            normalized.type = "server_error";
            normalized.isRetryable = true;
        } else if (err.response.status === 400) {
            normalized.code = "invalid_request";
            normalized.type = "client_error";
            normalized.isRetryable = false;
        }
    }
    // Handle generic HTTP errors
    else if (err?.response?.status) {
        normalized.status = err.response.status ?? 500;
        normalized.message = err.response.statusText || err.message || "HTTP error";
        normalized.isRetryable = (err.response.status ?? 0) >= 500;

        if ((err.response.status ?? 0) >= 500) {
            normalized.code = "server_error";
            normalized.type = "server_error";
        } else if ((err.response.status ?? 0) >= 400) {
            normalized.code = "client_error";
            normalized.type = "client_error";
        }
    }
    // Handle network/connection errors
    else if (err?.code === "ECONNREFUSED" || err?.code === "ENOTFOUND" || err?.code === "ETIMEDOUT") {
        normalized.status = 503;
        normalized.code = "connection_error";
        normalized.type = "network_error";
        normalized.message = "Unable to connect to provider service";
        normalized.isRetryable = true;
    }
    // Handle timeout errors
    else if (err?.code === "ECONNABORTED" || (typeof err?.message === "string" && err.message.includes("timeout"))) {
        normalized.status = 408;
        normalized.code = "timeout";
        normalized.type = "timeout_error";
        normalized.message = "Request timed out";
        normalized.isRetryable = true;
    }
    // Handle generic errors
    else if (typeof err?.message === "string") {
        normalized.message = err.message;

        // Try to infer error type from message
        if (err.message.toLowerCase().includes("api key")) {
            normalized.code = "invalid_api_key";
            normalized.type = "authentication_error";
            normalized.status = 401;
            normalized.isRetryable = false;
        } else if (err.message.toLowerCase().includes("rate limit")) {
            normalized.code = "rate_limit_exceeded";
            normalized.type = "rate_limit_error";
            normalized.status = 429;
            normalized.isRetryable = true;
        }
    }

    return normalized;
}

/**
 * Check if an error is retryable based on normalized error properties
 * @param normalizedError Normalized error object
 * @returns Boolean indicating if the error should be retried
 */
export function isRetryableError(normalizedError: NormalizedError): boolean {
    return normalizedError.isRetryable;
}

/**
 * Get retry delay in milliseconds for retryable errors
 * @param normalizedError Normalized error object
 * @param retryAttempt Current retry attempt number (0-based)
 * @returns Delay in milliseconds before next retry
 */
export function getRetryDelay(normalizedError: NormalizedError, retryAttempt: number): number {
    // Use retry-after header if available
    if (normalizedError.retryAfter) {
        return normalizedError.retryAfter * 1000; // Convert seconds to milliseconds
    }

    // Exponential backoff: 2^attempt * 1000ms, capped at 30 seconds
    const exponentialDelay = Math.pow(2, retryAttempt) * 1000;
    return Math.min(exponentialDelay, 30000);
}
