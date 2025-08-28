import { useState, useEffect } from "react";
import { useAuth } from "wasp/client/auth";
import { createConversation } from "../client/operations/conversations";
import TextApp from "./TextApp";
import ConversationCanvas from "./ConversationCanvas";
import Settings from "./Settings";
import LayoutContainer from "./layout/LayoutContainer";
import Sidebar from "./layout/Sidebar";
import ResizablePanelLayout from "./layout/ResizablePanelLayout";
import { Spinner } from "react-bootstrap";
import configService from "../services/configService";
import apiClientService from "../services/apiClientService";
import { LAYOUT_CONSTANTS } from "../constants/layoutConstants";
import { useConversationNodes } from "../hooks/useConversationNodes";
import { useNavigate } from "react-router-dom";

export default function TextAppManager({ conversationId }) {
    const navigate = useNavigate();
    // Auth state
    const { data: user, isLoading: isAuthLoading } = useAuth();
    // const { data: conversations, isLoading: conversationsLoading } = useQuery(getConversations);

    // Node-based state management
    const {
        nodes,
        loading: nodesLoading,
        error: nodesError,
        activeNodeId,
        createNode,
        updatePositions,
        updateWidths,
        selectNode,
        deleteNode,
        reconstructMessages,
        // hasNodes,
        refresh,
    } = useConversationNodes(conversationId);

    // Messages for the current active node
    const [currentMessages, setCurrentMessages] = useState([]);

    // Reset flag for TextApp
    const [resetFlag, setResetFlag] = useState(0);

    // Track if active node change is from manual selection
    const [manualSelection, setManualSelection] = useState(false);

    // Settings modal state
    const [showSettings, setShowSettings] = useState(false);

    // API configuration
    const [apiSettings, setApiSettings] = useState({
        provider: configService.getApiConfig().defaultProvider,
        model: configService.getApiConfig().defaultModel,
        apiKey: "server-managed",
    });

    // Initialize API client and settings
    useEffect(() => {
        const settings = apiClientService.init();
        setApiSettings(settings);
    }, []);

    // Update current messages when active node changes
    useEffect(() => {
        try {
            const messages = reconstructMessages();
            setCurrentMessages(messages);

            // Only increment resetFlag if this is a manual selection
            if (manualSelection) {
                setResetFlag((prev) => prev + 1);
                setManualSelection(false);
            }
        } catch (error) {
            console.error("Failed to reconstruct messages:", error);
            // Fall back to config messages
            const fallbackMessages = [
                {
                    role: "developer",
                    content: configService.getChatConfig().prompt,
                },
                {
                    role: "assistant",
                    content: configService.getChatConfig().initialMessage,
                },
            ];
            setCurrentMessages(fallbackMessages);

            // Only increment resetFlag if this is a manual selection
            if (manualSelection) {
                setResetFlag((prev) => prev + 1);
                setManualSelection(false);
            }
        }
    }, [reconstructMessages, manualSelection]);

    // Handle node selection from canvas
    const handleNodeSelect = (nodeId) => {
        setManualSelection(true);
        selectNode(nodeId);
    };

    // Handle node position updates from canvas (batch update)
    const handleNodePositionUpdate = async (positionUpdates) => {
        try {
            await updatePositions(positionUpdates);
        } catch (error) {
            console.error("Failed to update node positions:", error);
        }
    };

    // Handle node width updates from canvas (batch update)
    const handleNodeWidthUpdate = async (widthUpdates) => {
        try {
            await updateWidths(widthUpdates);
        } catch (error) {
            console.error("Failed to update node widths:", error);
        }
    };

    // Create a new node when a new message pair is added
    const handleNewMessagePair = async (userMessage, assistantMessage) => {
        if (!conversationId) {
            console.error("No conversation ID available");
            return;
        }

        try {
            // Calculate position for the new node based on siblings
            const parentNode = activeNodeId ? nodes.find((n) => n.id === activeNodeId) : null;
            const parentPosition = parentNode ? { x: parentNode.x, y: parentNode.y } : { x: 50, y: 50 };

            // Count existing children to position new node
            const siblings = nodes.filter((n) => n.parentId === activeNodeId);
            const siblingCount = siblings.length;

            // Position the new node to the right and below based on number of siblings
            const newPosition = {
                x: parentPosition.x + 350, // Fixed horizontal spacing
                y: parentPosition.y + siblingCount * 200, // Vertical positioning based on siblings
            };

            // Create the new node
            await createNode({
                parentId: activeNodeId, // This can be null for the first node
                userMessage,
                assistantMessage,
                x: newPosition.x,
                y: newPosition.y,
            });
        } catch (error) {
            console.error("Failed to create node:", error);
        }
    };

    // Handle new conversation creation
    const handleNewChat = async () => {
        try {
            const newConversation = await createConversation({});
            // Navigate to the new conversation
            navigate(`/chat/${newConversation.id}`);
        } catch (error) {
            console.error("Failed to create conversation:", error);
        }
    };

    // Handle back to conversations list
    const handleBackToList = () => {
        navigate("/");
    };

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

    // Show loading spinner while auth or nodes are loading
    if (isAuthLoading || nodesLoading) {
        return (
            <LayoutContainer>
                <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <div className="text-center">
                        <Spinner animation="border" role="status" />
                        <div className="mt-2">Loading...</div>
                    </div>
                </div>
            </LayoutContainer>
        );
    }

    // This should not happen due to authRequired: true, but just in case
    if (!user) {
        return (
            <LayoutContainer>
                <div className="d-flex justify-content-center align-items-center h-100">
                    <div className="text-center">
                        <p>Please log in to access the chatbot.</p>
                    </div>
                </div>
            </LayoutContainer>
        );
    }

    // Show error if nodes failed to load
    if (nodesError) {
        return (
            <LayoutContainer>
                <div className="d-flex justify-content-center align-items-center h-100">
                    <div className="text-center">
                        <p className="text-danger">Failed to load conversation: {nodesError}</p>
                        <button className="btn btn-primary mt-2" onClick={handleNewChat}>
                            Start New Conversation
                        </button>
                    </div>
                </div>
            </LayoutContainer>
        );
    }

    return (
        <LayoutContainer>
            <Sidebar
                user={user}
                onNewChat={handleNewChat}
                onShowSettings={() => setShowSettings(true)}
                onBackToList={handleBackToList}
            />

            <ResizablePanelLayout
                leftTitle="Conversation Map"
                rightTitle={
                    <span>
                        Active Conversation
                        <small className="text-muted ms-2">
                            {apiSettings.provider}: {apiSettings.model}
                        </small>
                    </span>
                }
                leftPanel={
                    <ConversationCanvas
                        nodes={nodes}
                        activeNodeId={activeNodeId}
                        onNodeSelect={handleNodeSelect}
                        onNodePositionUpdate={handleNodePositionUpdate}
                        onNodeWidthUpdate={handleNodeWidthUpdate}
                        onNodeDelete={deleteNode}
                        onRefresh={refresh}
                    />
                }
                rightPanel={
                    <TextApp
                        resetFlag={resetFlag}
                        initialMessages={currentMessages}
                        onNewMessagePair={handleNewMessagePair}
                        config={configService.getChatConfig()}
                        conversationId={conversationId}
                    />
                }
                leftDefaultSize={LAYOUT_CONSTANTS.PANEL_DEFAULT_SIZE}
                rightDefaultSize={LAYOUT_CONSTANTS.PANEL_DEFAULT_SIZE}
                minSize={LAYOUT_CONSTANTS.PANEL_MIN_SIZE}
                autoSaveId="main-panels"
            />

            {/* Settings Modal */}
            <Settings show={showSettings} onHide={() => setShowSettings(false)} onApply={handleApplySettings} />
        </LayoutContainer>
    );
}
