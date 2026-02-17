export default {
    chatConfig: {
        prompt: `
            You are a helpful assistant. Your goal is to help the user with whatever queries they have.
            Markdown format is always preferred in your response. Use markdown whenever necessary
        `,
        initialMessage: "Hello! How can I help you today?",
    },
    apiConfig: {
        providers: [
            {
                id: "openai",
                name: "OpenAI",
                url: "https://api.openai.com/v1",
                timeout: 1000000,
                retries: 3,
                models: [
                    {
                        id: "gpt-5.2-pro",
                        name: "GPT 5.2 Pro",
                    },
                    {
                        id: "gpt-4o",
                        name: "GPT-4o",
                    },
                    {
                        id: "gpt-4.1",
                        name: "GPT-4.1",
                    },
                    {
                        id: "gpt-5.2-chat-latest",
                        name: "GPT-5.2",
                    },
                    {
                        id: "gpt-4o-mini",
                        name: "GPT-4o Mini",
                    },
                    {
                        id: "gpt-4.1-mini",
                        name: "GPT-4.1 Mini",
                    },
                    {
                        id: "gpt-4.1-nano",
                        name: "GPT-4.1 Nano",
                    },
                    {
                        id: "gpt-5.2",
                        name: "GPT-5.2 Thinking",
                    },
                    {
                        id: "gpt-5-mini",
                        name: "GPT-5 Mini",
                    },
                ],
            },
            {
                id: "gemini",
                name: "Gemini",
                url: "https://generativelanguage.googleapis.com/v1beta/openai",
                timeout: 30000,
                retries: 3,
                models: [
                    {
                        id: "gemini-3-pro-preview",
                        name: "Gemini 3 Pro Preview",
                    },
                    {
                        id: "gemini-3-flash-preview",
                        name: "Gemini 3 Flash Preview",
                    },
                ],
            },
        ],
        defaultProvider: "openai",
        defaultModel: "gpt-4o-mini",
    },
};
