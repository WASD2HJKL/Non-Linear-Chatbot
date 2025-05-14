import { useState, useEffect } from "react";
import TextApp from "./TextApp";
import ConversationCanvas from "./ConversationCanvas";
import {
    Container,
    Dropdown,
    Nav,
    NavItem,
    NavLink,
    Row,
    Col,
} from "react-bootstrap";
import useStorage from "../hook/useStorage";

export default function TextAppManager() {
    const PERSONAS = [
        {
            name: "Bucky",
            prompt: "You are a helpful assistant named Bucky after the UW-Madison Mascot. Your goal is to help the user with whatever queries they have.",
            initialMessage: "Hello, my name is Bucky. How can I help you?",
        },
        {
            name: "Pirate Pete",
            prompt: "You are a helpful pirate assisting your mateys with their questions. Respond like a pirate would. Your goal is to help the user with whatever queries they have.",
            initialMessage:
                "Hello, my name is Pete the Pirate. How can I help you?",
        },
        {
            name: "J.A.R.V.I.S.",
            prompt: "You are J.A.R.V.I.S., Tony Stark's highly intelligent, composed, and extremely capable AI assistant. You speak with refined clarity, always polite, often dryly witty, and unshakably helpful under any circumstance.",
            initialMessage:
                "Good day. I am J.A.R.V.I.S., at your service. Please inform me of how I may assist you today — preferably before Mr. Stark asks me to launch anything into orbit.",
        },
    ];

    const [personaName, setPersonaName] = useStorage(
        "persona",
        PERSONAS[0].name,
    );
    const persona = PERSONAS.find((p) => p.name === personaName);

    // Store all conversation branches
    const [conversationTree, setConversationTree] = useStorage(
        "conversationTree",
        {},
    );

    // Track the currently active conversation branch
    const [activeBranchId, setActiveBranchId] = useStorage(
        "activeBranchId",
        "root",
    );

    // Messages for the current active branch
    const [currentMessages, setCurrentMessages] = useState([]);

    // Reset flag for TextApp
    const [resetFlag, setResetFlag] = useState(0);

    // Store node positions so they're preserved between updates
    const [nodePositions, setNodePositions] = useStorage("nodePositions", {});

    // Initialize or reset the conversation tree
    useEffect(() => {
        if (Object.keys(conversationTree).length === 0) {
            // Initialize with just the root branch containing persona messages
            const initialTree = {
                root: {
                    id: "root",
                    parentId: null,
                    messages: [
                        {
                            role: "developer",
                            content: persona.prompt,
                        },
                        {
                            role: "assistant",
                            content: persona.initialMessage,
                        },
                    ],
                    children: [],
                },
            };
            setConversationTree(initialTree);
            setActiveBranchId("root");
            // Reset node positions
            setNodePositions({ root: { x: 50, y: 50 } });
        }
    }, [persona]);

    // Load the active branch messages when active branch changes
    useEffect(() => {
        if (conversationTree[activeBranchId]) {
            setCurrentMessages(conversationTree[activeBranchId].messages);
        }
    }, [activeBranchId, conversationTree]);

    // Handle branch selection from canvas
    const handleBranchSelect = (branchId) => {
        setActiveBranchId(branchId);
        // Increment resetFlag to tell TextApp to reload with the new messages
        setResetFlag((prev) => prev + 1);
    };

    // Update node positions when they change in the canvas
    const handleNodePositionChange = (nodeId, position) => {
        setNodePositions((prev) => ({
            ...prev,
            [nodeId]: position,
        }));
    };

    // Create a new branch when a new message pair is added
    const handleNewMessagePair = (userMessage, assistantMessage) => {
        // Create a new branch ID
        const newBranchId = `branch-${Date.now()}`;

        // Get current branch
        const currentBranch = conversationTree[activeBranchId];

        // Create a new branch with all messages from parent plus the new pair
        const newBranch = {
            id: newBranchId,
            parentId: activeBranchId,
            messages: [
                ...currentBranch.messages,
                {
                    role: "user",
                    content: userMessage,
                },
                {
                    role: "assistant",
                    content: assistantMessage,
                },
            ],
            children: [],
        };

        // Calculate position for the new node based on siblings
        const parentPosition = nodePositions[activeBranchId] || { x: 0, y: 0 };
        const siblingCount =
            conversationTree[activeBranchId]?.children?.length || 0;

        // Position the new node to the right and below based on number of siblings
        const newPosition = {
            x: parentPosition.x + 350, // Fixed horizontal spacing
            y: parentPosition.y + siblingCount * 200, // Vertical positioning based on siblings
        };

        // Add the new branch to the tree
        setConversationTree((prevTree) => {
            // Add the new branch
            const updatedTree = {
                ...prevTree,
                [newBranchId]: newBranch,
            };

            // Update parent's children array
            updatedTree[activeBranchId] = {
                ...updatedTree[activeBranchId],
                children: [
                    ...updatedTree[activeBranchId].children,
                    newBranchId,
                ],
            };

            return updatedTree;
        });

        // Store the position of the new node
        setNodePositions((prev) => ({
            ...prev,
            [newBranchId]: newPosition,
        }));

        // Set the new branch as active
        setActiveBranchId(newBranchId);
    };

    // Function to reset the conversation
    function handleNewChat() {
        // Create a new conversation tree with just the root branch
        const initialTree = {
            root: {
                id: "root",
                parentId: null,
                messages: [
                    {
                        role: "developer",
                        content: persona.prompt,
                    },
                    {
                        role: "assistant",
                        content: persona.initialMessage,
                    },
                ],
                children: [],
            },
        };
        setConversationTree(initialTree);
        setActiveBranchId("root");
        // Reset node positions
        setNodePositions({ root: { x: 50, y: 50 } });
        setResetFlag((prev) => prev + 1);
    }

    // Handle persona change
    function handleSwitchPersona(selectedPersona) {
        setPersonaName(selectedPersona);
        handleNewChat(); // Reset the conversation with the new persona
    }

    return (
        <Container fluid style={{ marginTop: "0.25rem" }}>
            <Nav justify variant="tabs" className="mb-3">
                <Nav.Item>
                    <Nav.Link onClick={handleNewChat}>New Chat</Nav.Link>
                </Nav.Item>
                <Dropdown as={NavItem} onSelect={handleSwitchPersona}>
                    <Dropdown.Toggle as={NavLink}>Personas</Dropdown.Toggle>
                    <Dropdown.Menu>
                        {PERSONAS.map((p) => (
                            <Dropdown.Item
                                key={p.name}
                                eventKey={p.name}
                                active={personaName === p.name}>
                                {p.name}
                            </Dropdown.Item>
                        ))}
                    </Dropdown.Menu>
                </Dropdown>
            </Nav>

            <Row>
                {/* Conversation Canvas for visualization and navigation */}
                <Col md={6} className="mb-3">
                    <h5>Conversation Map</h5>
                    <div style={{ height: "70vh", border: "1px solid #ccc" }}>
                        <ConversationCanvas
                            conversationTree={conversationTree}
                            activeBranchId={activeBranchId}
                            nodePositions={nodePositions}
                            onBranchSelect={handleBranchSelect}
                            onNodePositionChange={handleNodePositionChange}
                        />
                    </div>
                </Col>

                {/* TextApp for the actual conversation */}
                <Col md={6}>
                    <h5>Active Conversation</h5>
                    <TextApp
                        persona={persona}
                        resetFlag={resetFlag}
                        initialMessages={currentMessages}
                        onNewMessagePair={handleNewMessagePair}
                    />
                </Col>
            </Row>
        </Container>
    );
}
