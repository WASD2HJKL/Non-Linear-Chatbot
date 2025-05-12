import { useEffect, useRef, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { BeatLoader } from "react-spinners";

import TextAppMessageList from "./TextAppMessageList";
import Constants from "../constants/Constants";
import useStorage from "../hook/useStorage";

function TextApp({ persona, resetFlag }) {
    // Set to true to block the user from sending another message
    const [isLoading, setIsLoading] = useState(false);

    const [messages, setMessages] = useState([]);
    const inputRef = useRef();

    const [chat, setChat] = useStorage("chat", []);

    /**
     * Called whenever the "Send" button is pressed.
     * @param {Event} e default form event; used to prevent from reloading the page.
     */
    async function handleSendAsStream(e) {
        e?.preventDefault();
        const input = inputRef.current.value?.trim();
        setIsLoading(true);
        if (input) {
            addMessage(Constants.Roles.User, input);
            addMessageToChat(Constants.Roles.User, input);
            inputRef.current.value = "";
            const resp = await fetch(
                "https://cs571api.cs.wisc.edu/rest/s25/hw11/completions-stream",
                {
                    method: "POST",
                    headers: {
                        "X-CS571-ID": CS571.getBadgerId(),
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify([
                        ...messages,
                        {
                            role: Constants.Roles.User,
                            content: input,
                        },
                    ]),
                },
            );

            const reader = resp.body.getReader();
            const decoder = new TextDecoder("utf-8");

            let unparsedLine = "";
            let constructedString = "";
            let done = false;

            addMessage(Constants.Roles.Assistant, constructedString);

            while (!done) {
                const respObj = await reader.read();
                const value = respObj.value;
                done = respObj.done;
                if (value) {
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk
                        .split("\n")
                        .filter((line) => line.trim() !== "");
                    for (const line of lines) {
                        try {
                            let deltaObj = JSON.parse(unparsedLine + line);
                            unparsedLine = "";
                            constructedString += deltaObj.delta;

                            // TODO You should display this to the user in realtime!
                            updateLastMessageContent(constructedString);
                        } catch (e) {
                            unparsedLine += line;
                        }
                    }
                }
            }

            addMessageToChat(Constants.Roles.Assistant, constructedString);
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

    const addMessageToChat = (role, content) => {
        setChat((o) => [
            ...o,
            {
                role: role,
                content: content,
            },
        ]);
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
            setChat([
                {
                    role: Constants.Roles.Developer,
                    content: persona.prompt,
                },
                {
                    role: Constants.Roles.Assistant,
                    content: persona.initialMessage,
                },
            ]);
        }
    }, [persona, resetFlag]); // eslint-disable-line

    useEffect(() => {
        if (chat.length !== 0) {
            setMessages(chat);
        }
    }, []);

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
