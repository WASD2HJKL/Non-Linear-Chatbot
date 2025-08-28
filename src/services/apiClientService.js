import configService from "./configService";
import { getSessionId } from "wasp/client/api";
import storageService from "../utils/storageService";
import logger from "../utils/clientLogger";

// API Client Factory
class ApiClientService {
    constructor() {
        this.currentProvider = null;
        this.currentModel = null;
    }

    // Initialize the service with saved preferences or defaults
    init() {
        const provider = storageService.getItem("provider", configService.getApiConfig().defaultProvider);
        const model = storageService.getItem("model", configService.getApiConfig().defaultModel);

        this.currentProvider = provider;
        this.currentModel = model;

        return {
            provider,
            model,
            apiKey: "server-managed",
        };
    }

    // Create and set a client for the specified provider
    setClient(provider, model, _apiKey) {
        this.currentProvider = provider;
        this.currentModel = model;

        storageService.setItem("provider", provider);
        storageService.setItem("model", model);
    }

    // Get the current model
    getModel() {
        return this.currentModel;
    }

    // Create chat completion with the current client and model
    async createChatCompletion(messages, options = {}) {
        // All providers now go through the server-side API
        // Server handles provider-specific implementations

        // Filter out empty messages (like placeholder assistant messages)
        const filteredMessages = messages.filter((msg) => msg.content && msg.content.trim().length > 0);

        // Get the session ID for authentication
        const sessionId = getSessionId();
        const headers = {
            "Content-Type": "application/json",
        };

        // Add Authorization header if we have a session ID
        if (sessionId) {
            headers["Authorization"] = `Bearer ${sessionId}`;
        }

        const apiBaseUrl = import.meta.env.REACT_APP_API_URL || "";
        const response = await fetch(`${apiBaseUrl}/api/ai/stream`, {
            method: "POST",
            headers,
            credentials: "include", // Include cookies as backup
            body: JSON.stringify({
                messages: filteredMessages,
                conversationId: options.conversationId || undefined,
                model: this.currentModel,
                provider: this.currentProvider, // Include provider for multi-provider support
            }),
        });

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (_parseError) {
                // If we can't parse JSON, use the response text
                try {
                    errorMessage = (await response.text()) || errorMessage;
                } catch (_textError) {
                    // If we can't get text either, use the status
                    errorMessage = `HTTP ${response.status} - ${response.statusText}`;
                }
            }
            throw new Error(errorMessage);
        }

        if (!response.body) {
            throw new Error("No response body received from server");
        }

        return this.createSimpleAsyncIterator(response.body);
    }

    /**
     * Queue-based async iterator for NDJSON streaming
     *
     * Fixes critical data loss bug where multiple NDJSON lines in a single
     * network packet would cause all but the first line to be discarded.
     *
     * Key features:
     * - Queue-first serving: Always check queue before network reads
     * - Bulk parsing: Process ALL lines from network chunks
     * - UTF-8 safe: Handles split multibyte characters correctly
     * - Memory efficient: O(lines in flight) not O(total lines)
     * - Error resilient: Malformed lines don't break the stream
     *
     * @param {ReadableStream} body - Response body stream from fetch()
     * @returns {AsyncIterator} Iterator yielding OpenAI-compatible delta objects
     */
    createSimpleAsyncIterator(body) {
        const reader = body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const lineQueue = []; // Queue to store parsed NDJSON objects from multi-line packets

        return {
            [Symbol.asyncIterator]() {
                return this;
            },

            async next() {
                try {
                    // Queue-first: serve buffered lines before reading network
                    if (lineQueue.length > 0) {
                        const queuedData = lineQueue.shift();
                        return {
                            value: {
                                choices: [
                                    {
                                        delta: { content: queuedData.delta },
                                    },
                                ],
                            },
                            done: false,
                        };
                    }

                    // Network read loop: bulk-parse and queue all lines
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            // Process any remaining buffer content before closing
                            if (buffer.trim()) {
                                try {
                                    const data = JSON.parse(buffer);
                                    // Handle both direct delta format and OpenAI-compatible format
                                    if (data && typeof data.delta !== "undefined") {
                                        // Direct delta format: {"delta": "content"}
                                        lineQueue.push(data);
                                    } else if (
                                        data &&
                                        data.choices &&
                                        data.choices[0] &&
                                        data.choices[0].delta &&
                                        data.choices[0].delta.content
                                    ) {
                                        // OpenAI-compatible format: {"choices":[{"delta":{"content":"..."}}]}
                                        lineQueue.push({ delta: data.choices[0].delta.content });
                                    }
                                } catch (err) {
                                    console.warn("Invalid final NDJSON line:", { line: buffer, error: err.message });
                                }
                            }
                            reader.releaseLock();
                            return { done: true };
                        }

                        // Safe UTF-8 handling with stream:true for partial multibyte chars
                        buffer += decoder.decode(value, { stream: true });

                        // Buffer size protection - prevent memory exhaustion attacks
                        if (buffer.length > 1048576) {
                            // 1MB limit
                            reader.releaseLock();
                            throw new Error("Buffer size exceeded 1MB limit - possible malicious stream");
                        }

                        const lines = buffer.split("\n");
                        buffer = lines.pop() ?? ""; // Keep partial line for next chunk

                        // Bulk parse: process ALL lines in this network chunk
                        const parseStart = performance.now();
                        for (const line of lines) {
                            if (line.trim()) {
                                try {
                                    const data = JSON.parse(line);
                                    logger.debug(`[CLIENT DEBUG] Parsed NDJSON line: ${JSON.stringify(data)}`);
                                    // Handle both direct delta format and OpenAI-compatible format
                                    if (data && typeof data.delta !== "undefined") {
                                        // Direct delta format: {"delta": "content"}
                                        logger.debug(
                                            `[CLIENT DEBUG] Using direct delta format: ${JSON.stringify(data.delta)}`,
                                        );
                                        lineQueue.push(data);
                                    } else if (
                                        data &&
                                        data.choices &&
                                        data.choices[0] &&
                                        data.choices[0].delta &&
                                        data.choices[0].delta.content
                                    ) {
                                        // OpenAI-compatible format: {"choices":[{"delta":{"content":"..."}}]}
                                        logger.debug(
                                            `[CLIENT DEBUG] Using OpenAI format, content: ${data.choices[0].delta.content}`,
                                        );
                                        lineQueue.push({ delta: data.choices[0].delta.content });
                                    } else {
                                        console.warn("NDJSON line missing delta field:", line);
                                    }
                                } catch (err) {
                                    console.warn("Invalid NDJSON line:", { line, error: err.message });
                                }
                            }
                        }

                        // Performance monitoring for unusual parsing times
                        const parseTime = performance.now() - parseStart;
                        if (parseTime > 10) {
                            console.debug("Slow NDJSON parse:", {
                                lines: lines.length,
                                time: parseTime.toFixed(2) + "ms",
                                queueSize: lineQueue.length,
                            });
                        }

                        // Memory safety: warn about unusually large queues
                        if (lineQueue.length > 100) {
                            console.warn("Large line queue detected:", {
                                queueSize: lineQueue.length,
                                suggestion: "Check for slow consumer or high-volume stream",
                            });
                        }

                        // Return first queued line if any were parsed
                        if (lineQueue.length > 0) {
                            const firstData = lineQueue.shift();
                            return {
                                value: {
                                    choices: [
                                        {
                                            delta: { content: firstData.delta },
                                        },
                                    ],
                                },
                                done: false,
                            };
                        }
                        // Continue reading if no valid lines in this chunk
                    }
                } catch (error) {
                    console.error("Error in stream iterator:", error);
                    reader.releaseLock();
                    throw error;
                }
            },
        };
    }
}

// Create a singleton instance
const apiClientService = new ApiClientService();

export default apiClientService;
