import { useState } from "react";
import TextApp from "./TextApp";

import { Container, Dropdown, Nav, NavItem, NavLink } from "react-bootstrap";
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

    const [resetFlag, setResetFlag] = useState(0);
    function handleNewChat() {
        setResetFlag((f) => f + 1);
    }

    function handleSwitchPersona(selectedPersona) {
        setResetFlag((f) => f + 1);
        setPersonaName(selectedPersona);
    }

    return (
        <Container style={{ marginTop: "0.25rem" }}>
            <Nav justify variant="tabs">
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
            <TextApp persona={persona} resetFlag={resetFlag} />
        </Container>
    );
}
