import { useEffect, useRef, useState } from "react";
import { Button, Form, Alert } from "react-bootstrap";
import { BeatLoader } from "react-spinners";

import TextAppMessageList from "./TextAppMessageList";
import Constants from "../constants/Constants";
import apiClientService from "../services/apiClientService";

function TextApp({ resetFlag, initialMessages, onNewMessagePair, config, conversationId }) {
    // Set to true to block the user from sending another message
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);
    const [inputValue, setInputValue] = useState("");
    const [shouldScrollToUser, setShouldScrollToUser] = useState(false);
    const inputRef = useRef();

    // Auto-resize textarea based on content height up to maximum limit
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = "auto";
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 300) + "px";
        }
    }, [inputValue]);

    /**
     * Handle keyboard events for dual-key submission (Shift+Enter and Ctrl+Enter)
     * @param {KeyboardEvent} event - Standard DOM keyboard event object
     */
    function handleKeyDown(event) {
        if ((event.shiftKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            handleSendAsStream(event);
        }
    }

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
        setInputValue("");

        // initialize assistant message
        addMessage(Constants.Roles.Assistant, "");

        try {
            // Use the apiClientService to make API calls
            const stream = await apiClientService.createChatCompletion(
                [...messages, { role: "user", content: input }],
                { conversationId },
            );

            let accumulated = "";

            // Handle streaming for all providers (server normalizes all responses to same NDJSON format)
            try {
                // Manual iteration through async iterator
                while (true) {
                    const result = await stream.next();

                    if (result.done) {
                        break;
                    }

                    const part = result.value;
                    const delta = part.choices[0].delta.content;
                    if (delta) {
                        accumulated += delta;
                        updateLastMessageContent(accumulated);
                    }
                }
            } catch (streamError) {
                console.error("Error in stream consumption:", streamError);
                throw streamError;
            }

            // Notify parent about the new message pair
            if (onNewMessagePair) {
                onNewMessagePair(input, accumulated);
            }
        } catch (err) {
            console.error("Error calling API:", err);

            // Handle specific error types from new backend
            if (err.message.includes("Unauthorized") || err.message.includes("401")) {
                setError("Please log in to continue the conversation.");
                updateLastMessageContent("Authentication required. Please refresh the page and log in again.");
            } else if (err.message.includes("HTTP 5") || err.message.includes("500")) {
                setError("Server error occurred. Please try again.");
                updateLastMessageContent("I'm sorry, there was a server error. Please try again in a moment.");
            } else if (err.message.includes("400")) {
                setError("Invalid request. Please check your message and try again.");
                updateLastMessageContent("I'm sorry, there was an issue with your request. Please try again.");
            } else {
                setError(`API Error: ${err.message || "Unknown error occurred"}`);
                updateLastMessageContent("I'm sorry, there was an error communicating with the API. Please try again.");
            }
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

    // Trigger scroll to user message when resetFlag changes (node selection)
    useEffect(() => {
        if (resetFlag > 0) {
            setShouldScrollToUser(true);
            // Reset the flag after a brief moment to allow the scroll to happen
            const timer = setTimeout(() => setShouldScrollToUser(false), 100);
            return () => clearTimeout(timer);
        }
    }, [resetFlag]);

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

    // Check if API key is set (server-managed now)
    const apiKeyMissing = false;

    return (
        <div className="app">
            {error && (
                <Alert variant="danger" onClose={() => setError(null)} dismissible>
                    {error}
                </Alert>
            )}

            <TextAppMessageList messages={messages} shouldScrollToUser={shouldScrollToUser} />
            {isLoading ? <BeatLoader color="#36d7b7" /> : <></>}
            <div className="input-area">
                <Form className="inline-form" onSubmit={handleSendAsStream}>
                    <Form.Control
                        as="textarea"
                        ref={inputRef}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
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
            <div className="keyboard-hint">Press Enter for new line, Shift+Enter or Ctrl+Enter to send</div>
        </div>
    );
}

export default TextApp;
