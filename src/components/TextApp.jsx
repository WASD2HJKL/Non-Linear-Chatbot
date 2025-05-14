import { useEffect, useRef, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { BeatLoader } from "react-spinners";
import OpenAI from "openai";

import TextAppMessageList from "./TextAppMessageList";
import Constants from "../constants/Constants";

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const CS571 = new OpenAI({
    apiKey: API_KEY,
    dangerouslyAllowBrowser: true,
});

function TextApp({ resetFlag, initialMessages, onNewMessagePair, config }) {
    // Set to true to block the user from sending another message
    const [isLoading, setIsLoading] = useState(false);

    const [messages, setMessages] = useState([]);
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
        addMessage(Constants.Roles.User, input);
        inputRef.current.value = "";

        // initialize assistant message
        addMessage(Constants.Roles.Assistant, "");

        // call OpenAI's streaming endpoint
        const stream = await CS571.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [...messages, { role: "user", content: input }],
            stream: true,
        });

        let accumulated = "";
        // the client returns an async iterable
        for await (const part of stream) {
            const delta = part.choices[0].delta.content;
            if (delta) {
                accumulated += delta;
                updateLastMessageContent(accumulated);
            }
        }

        // Notify parent about the new message pair
        if (onNewMessagePair) {
            onNewMessagePair(input, accumulated);
        }

        setIsLoading(false);
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
    }, [resetFlag, initialMessages, config]);

    return (
        <div className="app">
            <TextAppMessageList messages={messages} />
            {isLoading ? <BeatLoader color="#36d7b7" /> : <></>}
            <div className="input-area">
                <Form className="inline-form" onSubmit={handleSendAsStream}>
                    <Form.Control
                        ref={inputRef}
                        style={{ marginRight: "0.5rem", display: "flex" }}
                        placeholder="Type a message..."
                        aria-label="Type and submit to send a message."
                    />
                    <Button type="submit" disabled={isLoading}>
                        Send
                    </Button>
                </Form>
            </div>
        </div>
    );
}

export default TextApp;
