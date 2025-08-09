import { useParams } from "react-router-dom";
import TextAppManager from "../components/TextAppManager";
import { Container } from "react-bootstrap";
import { ThemeProvider } from "../contexts/ThemeContext";
import "../index.css";
import "bootstrap/dist/css/bootstrap.min.css";

export const ChatPage = () => {
    const { conversationId } = useParams<{ conversationId: string }>();

    if (!conversationId) {
        return (
            <Container className="d-flex justify-content-center align-items-center min-vh-100">
                <div className="text-center">
                    <h3>Invalid conversation ID</h3>
                    <p>The conversation you're looking for doesn't exist.</p>
                    <a href="/" className="btn btn-primary">
                        Return to Conversations
                    </a>
                </div>
            </Container>
        );
    }

    return (
        <ThemeProvider>
            <TextAppManager conversationId={conversationId} />
        </ThemeProvider>
    );
};
