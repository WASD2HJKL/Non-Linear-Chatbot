import { useEffect, useRef, useState } from "react";
import { Button, Form, Alert } from "react-bootstrap";
import { BeatLoader } from "react-spinners";

import TextAppMessageList from "./TextAppMessageList";
import Constants from "../constants/Constants";
import apiClientService from "../services/apiClientService";

function TextApp({
    resetFlag,
    initialMessages,
    onNewMessagePair,
    config,
    apiSettings,
}) {
    // Set to true to block the user from sending another message
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);
    const inputRef = useRef();

    /**
     * Called whenever the "Send" button is pressed.
     * @param {Event} e default form event; used to prevent from reloading the page.
     */
    async function handleSendAsStream(e) {
        e?.preventDefault();
        const input = inputRef.current.value?.trim();
        if (!input) return;

        setIsLoading(true);
        setError(null);
        addMessage(Constants.Roles.User, input);
        inputRef.current.value = "";

        // initialize assistant message
        addMessage(Constants.Roles.Assistant, "");

        try {
            // Use the apiClientService to make API calls
            const stream = await apiClientService.createChatCompletion([
                ...messages,
                { role: "user", content: input },
            ]);

            let accumulated = "";
            // Process the stream based on the provider
            if (apiSettings.provider === "openai") {
                // Handle OpenAI streaming
                for await (const part of stream) {
                    const delta = part.choices[0].delta.content;
                    if (delta) {
                        accumulated += delta;
                        updateLastMessageContent(accumulated);
                    }
                }
            } else if (apiSettings.provider === "anthropic") {
                // This is a placeholder for Anthropic streaming
                // In a real implementation, this would handle Anthropic's specific streaming format
                throw new Error(
                    "Anthropic API integration is incomplete in this demo"
                );
            }

            // Notify parent about the new message pair
            if (onNewMessagePair) {
                onNewMessagePair(input, accumulated);
            }
        } catch (err) {
            console.error("Error calling API:", err);
            setError(`API Error: ${err.message || "Unknown error occurred"}`);
            updateLastMessageContent(
                "I'm sorry, there was an error communicating with the API. Please check your API settings and try again."
            );
        } finally {
            setIsLoading(false);
        }
    }

    /**
     * Adds a message to the ongoing TextAppMessageList
     *
     * @param {string} role The role of the message; either "user", "assistant", or "developer"
     * @param {*} content The content of the message
     */
    function addMessage(role, content) {
        setMessages((o) => [
            ...o,
            {
                role: role,
                content: content,
            },
        ]);
    }

    const updateLastMessageContent = (msg) => {
        if (messages.length === 0) {
            return;
        }

        setMessages((prevMessages) => {
            const updated = [...prevMessages];
            updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: msg,
            };
            return updated;
        });
    };

    // Load messages when initialMessages or resetFlag changes
    useEffect(() => {
        if (initialMessages && initialMessages.length > 0) {
            setMessages(initialMessages);
        } else {
            // Default initialization
            setMessages([
                {
                    role: Constants.Roles.Developer,
                    content: config.prompt,
                },
                {
                    role: Constants.Roles.Assistant,
                    content: config.initialMessage,
                },
            ]);
        }
        setError(null);
    }, [resetFlag, initialMessages, config]);

    // Check if API key is set
    const apiKeyMissing = !apiSettings.apiKey;

    return (
        <div className="app">
            {error && (
                <Alert
                    variant="danger"
                    onClose={() => setError(null)}
                    dismissible
                >
                    {error}
                </Alert>
            )}

            {apiKeyMissing && (
                <Alert variant="warning">
                    Please set your API key in the settings to use the chat.
                </Alert>
            )}

            <TextAppMessageList messages={messages} />
            {isLoading ? <BeatLoader color="#36d7b7" /> : <></>}
            <div className="input-area">
                <Form className="inline-form" onSubmit={handleSendAsStream}>
                    <Form.Control
                        ref={inputRef}
                        style={{ marginRight: "0.5rem", display: "flex" }}
                        placeholder="Type a message..."
                        aria-label="Type and submit to send a message."
                        disabled={isLoading || apiKeyMissing}
                    />
                    <Button type="submit" disabled={isLoading || apiKeyMissing}>
                        Send
                    </Button>
                </Form>
            </div>
        </div>
    );
}

export default TextApp;
