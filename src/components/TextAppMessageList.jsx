import { useEffect, useRef } from "react";
import { Container, Row } from "react-bootstrap";
import Message from "./Message";
import Constants from "../constants/Constants";

export default function TextAppMessageList({ messages }) {
    const lastItem = useRef();

    useEffect(() => {
        lastItem.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <Container className="message-list">
            {messages.map(
                (message, i) =>
                    message.role !== Constants.Roles.Developer && (
                        <Row
                            ref={
                                i === messages.length - 1 ? lastItem : undefined
                            }
                            key={i}
                            style={{ marginBottom: "0.25rem" }}
                        >
                            <Message
                                role={message.role}
                                content={message.content}
                            />
                        </Row>
                    )
            )}
        </Container>
    );
}
