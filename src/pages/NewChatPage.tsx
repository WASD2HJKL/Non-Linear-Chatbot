import { useEffect, useRef } from "react";
import { useAuth } from "wasp/client/auth";
import { createConversation } from "../client/operations/conversations";
import { Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ThemeProvider } from "../contexts/ThemeContext";
import "../index.css";
import "bootstrap/dist/css/bootstrap.min.css";

export const NewChatPage = () => {
    const { data: user } = useAuth();
    const navigate = useNavigate();
    const creatingRef = useRef(false);

    useEffect(() => {
        const createNewConversation = async () => {
            // Prevent multiple calls
            if (creatingRef.current) return;
            creatingRef.current = true;

            try {
                const newConversation = (await createConversation({
                    title: "New Conversation",
                })) as { id: string };

                // Navigate to the new conversation
                navigate(`/chat/${newConversation.id}`);
            } catch (error) {
                console.error("Failed to create conversation:", error);
                // Redirect to home on error
                navigate("/");
            }
        };

        if (user && !creatingRef.current) {
            void createNewConversation();
        }
    }, [user, navigate]);

    return (
        <ThemeProvider>
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <div className="text-center">
                    <Spinner animation="border" role="status" />
                    <div className="mt-2">Creating new conversation...</div>
                </div>
            </div>
        </ThemeProvider>
    );
};
