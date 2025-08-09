export default {
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
                        name: "Thinking could be buggy for current implementation",
                    },
                    {
                        id: "gpt-4.1-nano",
                        name: "Using below Thinking model AT YOUR OWN RISK",
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
        ],
        defaultProvider: "openai",
        defaultModel: "gpt-4o-mini",
    },
};
