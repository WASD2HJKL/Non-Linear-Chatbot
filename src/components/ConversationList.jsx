import { useState, useEffect } from "react";
import { useAuth, logout } from "wasp/client/auth";
import { useQuery } from "wasp/client/operations";
import { getConversations } from "../client/operations/conversations";
import { Button, Card, Container, Row, Col, Spinner, Alert, Dropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Settings from "./Settings";
import configService from "../services/configService";
import apiClientService from "../services/apiClientService";

export default function ConversationList() {
    const { data: user, isLoading: isAuthLoading } = useAuth();
    const { data: conversations, isLoading: conversationsLoading, error } = useQuery(getConversations);
    const [showSettings, setShowSettings] = useState(false);
    const [apiSettings, setApiSettings] = useState({
        provider: configService.getApiConfig().defaultProvider,
        model: configService.getApiConfig().defaultModel,
        apiKey: "server-managed",
    });
    const navigate = useNavigate();

    // Initialize API client and settings
    useEffect(() => {
        const settings = apiClientService.init();
        setApiSettings(settings);
    }, []);

    // Handle settings changes
    const handleApplySettings = (newSettings) => {
        try {
            apiClientService.setClient(newSettings.provider, newSettings.model, newSettings.apiKey);
            setApiSettings(newSettings);
        } catch (error) {
            console.error("Failed to apply settings:", error);
            alert("Failed to apply settings: " + error.message);
        }
    };

    // Handle new conversation
    const handleNewConversation = () => {
        navigate("/new");
    };

    // Handle conversation click
    const handleConversationClick = (conversationId) => {
        navigate(`/chat/${conversationId}`);
    };

    // Handle logout
    const handleLogout = () => {
        logout();
    };

    // Render user profile dropdown
    const renderUserProfileDropdown = () => {
        if (!user || !user.email) return null;

        const userInitial = user.email.charAt(0).toUpperCase();

        return (
            <Dropdown className="ms-2">
                <style>{`
                    .custom-dropdown-toggle::after {
                        display: none !important;
                    }
                `}</style>
                <Dropdown.Toggle
                    as={Button}
                    variant="link"
                    className="p-0 border-0"
                    id="user-dropdown"
                    style={{
                        backgroundColor: "transparent",
                        boxShadow: "none",
                    }}
                    bsPrefix="custom-dropdown-toggle"
                >
                    <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                            width: "32px",
                            height: "32px",
                            backgroundColor: "var(--primary-color)",
                            color: "white",
                            fontSize: "14px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            transition: "opacity 0.2s ease",
                        }}
                        onMouseEnter={(e) => (e.target.style.opacity = "0.8")}
                        onMouseLeave={(e) => (e.target.style.opacity = "1")}
                    >
                        {userInitial}
                    </div>
                </Dropdown.Toggle>

                <Dropdown.Menu align="end">
                    <Dropdown.Header className="text-muted">{user.email}</Dropdown.Header>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={() => setShowSettings(true)}>Settings</Dropdown.Item>
                    <Dropdown.Item onClick={handleLogout} className="text-danger">
                        Sign Out
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        );
    };

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        } else if (diffInHours < 24 * 7) {
            return date.toLocaleDateString([], { weekday: "short", hour: "2-digit", minute: "2-digit" });
        } else {
            return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
        }
    };

    // Show loading spinner while auth is loading
    if (isAuthLoading) {
        return (
            <Container className="d-flex justify-content-center align-items-center min-vh-100">
                <div className="text-center">
                    <Spinner animation="border" role="status" />
                    <div className="mt-2">Loading...</div>
                </div>
            </Container>
        );
    }

    // This should not happen due to authRequired: true, but just in case
    if (!user) {
        return (
            <Container className="d-flex justify-content-center align-items-center min-vh-100">
                <div className="text-center">
                    <p>Please log in to access your conversations.</p>
                </div>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center">
                        <h1>Your Conversations</h1>
                        <div className="d-flex align-items-center">
                            <Button variant="primary" className="me-2" onClick={handleNewConversation}>
                                New Conversation
                            </Button>
                            {renderUserProfileDropdown()}
                        </div>
                    </div>
                </Col>
            </Row>

            {error && (
                <Alert variant="danger" className="mb-4">
                    Failed to load conversations: {error.message}
                </Alert>
            )}

            {conversationsLoading ? (
                <div className="text-center">
                    <Spinner animation="border" role="status" />
                    <div className="mt-2">Loading conversations...</div>
                </div>
            ) : conversations && conversations.length > 0 ? (
                <Row>
                    {conversations.map((conversation) => (
                        <Col key={conversation.id} md={6} lg={4} className="mb-3">
                            <Card
                                className="h-100 cursor-pointer"
                                onClick={() => handleConversationClick(conversation.id)}
                                style={{ cursor: "pointer" }}
                            >
                                <Card.Body>
                                    <Card.Title className="text-truncate">
                                        {conversation.title || "Untitled Conversation"}
                                    </Card.Title>
                                    <Card.Text className="text-muted">
                                        {conversation.nodes && conversation.nodes.length > 0 ? (
                                            <small>
                                                {conversation.nodes.length} message
                                                {conversation.nodes.length !== 1 ? "s" : ""}
                                            </small>
                                        ) : (
                                            <small>No messages yet</small>
                                        )}
                                    </Card.Text>
                                    <Card.Text>
                                        <small className="text-muted">{formatDate(conversation.updatedAt)}</small>
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : (
                <div className="text-center py-5">
                    <h3 className="text-muted">No conversations yet</h3>
                    <p className="text-muted">Start your first conversation to get started!</p>
                    <Button variant="primary" size="lg" onClick={handleNewConversation}>
                        Start New Conversation
                    </Button>
                </div>
            )}

            {/* Settings Modal */}
            <Settings show={showSettings} onHide={() => setShowSettings(false)} onApply={handleApplySettings} />
        </Container>
    );
}
