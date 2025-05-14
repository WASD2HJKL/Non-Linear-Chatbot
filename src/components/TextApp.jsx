import { useEffect, useRef, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { BeatLoader } from "react-spinners";
import { nanoid } from 'nanoid';
import OpenAI from "openai";

import TextAppMessageList from "./TextAppMessageList";
import Constants from "../constants/Constants";
import useStorage from "../hook/useStorage";

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const agent = new OpenAI({
    apiKey: API_KEY,
    dangerouslyAllowBrowser: true,
});

function TextApp({ persona, resetFlag }) {
    // Set to true to block the user from sending another message
    const [isLoading, setIsLoading] = useState(false);

    const [messages, setMessages] = useState([]);
    const inputRef = useRef();

    const [chatHistory, setChatHistory] = useStorage("chat", []);
    const [lastChatID, setLastChatID] = useStorage("chatID", null);

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
        let userMessageID = addMessageToChatHistory(Constants.Roles.User, input, lastChatID);
        inputRef.current.value = "";

        // initialize assistant message
        addMessage(Constants.Roles.Assistant, "");

        // call OpenAI’s streaming endpoint
        const stream = await agent.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                ...messages,
                { role: Constants.Roles.User, content: input },
            ],
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

        let id = addMessageToChatHistory(Constants.Roles.Assistant, accumulated, userMessageID);
        setLastChatID(id);
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

    const addMessageToChatHistory = (role, content, pid) => {
        const newChatID = nanoid();
        setChatHistory((msg) => [
            ...msg,
            {
                role: role,
                content: content,
                ID: newChatID,
                parentID: pid,
            },
        ]);

        return newChatID;
    };

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

    useEffect(() => {
        setMessages([
            {
                role: Constants.Roles.Developer,
                content: persona.prompt,
            },
            {
                role: Constants.Roles.Assistant,
                content: persona.initialMessage,
            },
        ]);
        if (resetFlag > 0) {
            setChatHistory([]);
            let developerMessageID = addMessageToChatHistory(Constants.Roles.Developer, persona.prompt, null);
            let AssistantInitialMessageID = addMessageToChatHistory(Constants.Roles.Assistant, persona.initialMessage, developerMessageID);
            setLastChatID(AssistantInitialMessageID);
        }
    }, [persona, resetFlag]); // eslint-disable-line

    function retrieveCurrentChat() {
        if (chatHistory.length === 0) {
            return [];
        }

        let id = lastChatID;
        let chats = [];

        while (id != null) {
            const chat = chatHistory.find((msg) => msg.ID === id);
            chats.push({ role: chat.role, content: chat.content });
            id = chat.parentID;
        }
        chats.reverse();
        return chats;
    }

    useEffect(() => {
        if (chatHistory.length === 0) {
            setMessages([
                {
                    role: Constants.Roles.Developer,
                    content: persona.prompt,
                },
                {
                    role: Constants.Roles.Assistant,
                    content: persona.initialMessage,
                },
            ]);
            let developerMessageID = addMessageToChatHistory(Constants.Roles.Developer, persona.prompt, null);
            let AssistantInitialMessageID = addMessageToChatHistory(Constants.Roles.Assistant, persona.initialMessage, developerMessageID);
            setLastChatID(AssistantInitialMessageID);
        }
        if (chatHistory.length !== 0) {
            setMessages(retrieveCurrentChat());
        }
    }, []);  // eslint-disable-line

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

