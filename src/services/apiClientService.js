import OpenAI from "openai";
import chatConfig from "../../config.json";

// API Client Factory
class ApiClientService {
    constructor() {
        this.apiClients = {};
        this.currentProvider = null;
        this.currentModel = null;
    }

    // Initialize the service with saved preferences or defaults
    init() {
        // Get saved preferences or use defaults
        const provider =
            localStorage.getItem("provider") ||
            chatConfig.apiConfig.defaultProvider;
        const model =
            localStorage.getItem("model") || chatConfig.apiConfig.defaultModel;
        const apiKey = localStorage.getItem("apiKey") || "";

        this.setClient(provider, model, apiKey);

        return {
            provider,
            model,
            apiKey,
        };
    }

    // Create and set a client for the specified provider
    setClient(provider, model, apiKey) {
        if (!apiKey) {
            console.error("API key is required");
            throw new Error("API key is required");
        }

        this.currentProvider = provider;
        this.currentModel = model;

        // Create a client if it doesn't exist for this provider
        if (!this.apiClients[provider]) {
            switch (provider) {
                case "openai":
                    this.apiClients[provider] = new OpenAI({
                        apiKey,
                        dangerouslyAllowBrowser: true,
                    });
                    break;

                case "anthropic":
                    // Would use Anthropic client here if available
                    console.warn("Anthropic API support is simulated");
                    this.apiClients[provider] = {
                        async chatCompletions(options) {
                            // This is a placeholder implementation
                            throw new Error(
                                "Anthropic API is not fully implemented in this demo",
                            );
                        },
                    };
                    break;

                default:
                    throw new Error(`Unsupported provider: ${provider}`);
            }
        }

        return this.apiClients[provider];
    }

    // Get the current client
    getClient() {
        if (!this.currentProvider || !this.apiClients[this.currentProvider]) {
            throw new Error("API client not initialized");
        }
        return this.apiClients[this.currentProvider];
    }

    // Get the current model
    getModel() {
        return this.currentModel;
    }

    // Create chat completion with the current client and model
    async createChatCompletion(messages, options = {}) {
        const client = this.getClient();
        const model = this.getModel();

        // Handle different APIs with a common interface
        switch (this.currentProvider) {
            case "openai":
                return client.chat.completions.create({
                    model,
                    messages,
                    stream: true,
                    ...options,
                });

            case "anthropic":
                // This would use the Anthropic client implementation
                return client.chatCompletions({
                    model,
                    messages,
                    ...options,
                });

            default:
                throw new Error(
                    `Unsupported provider: ${this.currentProvider}`,
                );
        }
    }
}

// Create a singleton instance
const apiClientService = new ApiClientService();

export default apiClientService;
