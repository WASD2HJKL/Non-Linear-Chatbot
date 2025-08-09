import configData from "../config.js";

// Centralized configuration management service
class ConfigService {
    constructor() {
        this.config = null;
        this.defaultConfig = {
            chatConfig: {
                prompt: "You are a helpful assistant. Your goal is to help the user with whatever queries they have.",
                initialMessage: "Hello! How can I help you today?",
            },
            apiConfig: {
                providers: [
                    {
                        id: "openai",
                        name: "OpenAI",
                        models: [
                            {
                                id: "gpt-4o-mini",
                                name: "GPT-4o Mini",
                            },
                        ],
                    },
                ],
                defaultProvider: "openai",
                defaultModel: "gpt-4o-mini",
            },
        };
    }

    // Get complete configuration object
    getConfig() {
        if (!this.config) {
            try {
                this.config = configData || this.defaultConfig;
            } catch (error) {
                console.warn("Failed to load config.js, using defaults:", error);
                this.config = this.defaultConfig;
            }
        }
        return this.config;
    }

    // Get API-specific configuration
    getApiConfig() {
        const config = this.getConfig();
        return config.apiConfig || this.defaultConfig.apiConfig;
    }

    // Get chat-specific configuration
    getChatConfig() {
        const config = this.getConfig();
        return config.chatConfig || this.defaultConfig.chatConfig;
    }
}

// Create singleton instance
const configService = new ConfigService();

export default configService;
