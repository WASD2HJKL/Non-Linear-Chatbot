import { useEffect, useRef } from "react";
import { Container, Row } from "react-bootstrap";
import Message from "./Message";
import Constants from "../constants/Constants";

export default function TextAppMessageList({ messages, shouldScrollToUser = false }) {
    const userMessageRefs = useRef({});

    // Auto-scroll to last User message when shouldScrollToUser is true (node selection)
    useEffect(() => {
        if (shouldScrollToUser && messages.length > 0) {
            // Find the last User message
            for (let i = messages.length - 1; i >= 0; i--) {
                if (messages[i].role === Constants.Roles.User) {
                    const userMessageRef = userMessageRefs.current[i];
                    if (userMessageRef) {
                        userMessageRef.scrollIntoView({ behavior: "smooth" });
                    }
                    break;
                }
            }
        }
    }, [shouldScrollToUser, messages]);

    return (
        <Container className="message-list">
            {messages.map(
                (message, i) =>
                    message.role !== Constants.Roles.Developer && (
                        <Row
                            ref={
                                message.role === Constants.Roles.User
                                    ? (el) => {
                                          userMessageRefs.current[i] = el;
                                      }
                                    : undefined
                            }
                            key={i}
                            style={{ marginBottom: "0.25rem" }}
                        >
                            <Message role={message.role} content={message.content} />
                        </Row>
                    ),
            )}
        </Container>
    );
}
