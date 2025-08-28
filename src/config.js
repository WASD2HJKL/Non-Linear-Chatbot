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
                        id: "gpt-4o",
                        name: "GPT-4o",
                    },
                    {
                        id: "gpt-4.1",
                        name: "GPT-4.1",
                    },
                    {
                        id: "gpt-5-chat-latest",
                        name: "GPT-5 Chat",
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
                        id: "gpt-5",
                        name: "GPT-5 Thinking",
                    },
                    {
                        id: "gpt-5-mini",
                        name: "GPT-5 Mini",
                    },
                    {
                        id: "o4-mini",
                        name: "O4 Mini",
                    },
                    {
                        id: "gpt-5-nano",
                        name: "GPT-5 Nano",
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
                        id: "gemini-2.5-pro",
                        name: "Gemini 2.5 Pro",
                    },
                    {
                        id: "gemini-2.5-flash",
                        name: "Gemini 2.5 Flash",
                    },
                    {
                        id: "gemini-2.5-flash-lite",
                        name: "Gemini 2.5 Flash-Lite",
                    },
                    {
                        id: "gemini-2.0-flash",
                        name: "Gemini 2.0 Flash",
                    },
                ],
            },
        ],
        defaultProvider: "openai",
        defaultModel: "gpt-4o-mini",
    },
};
