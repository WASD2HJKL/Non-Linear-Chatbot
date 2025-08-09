import React, { useEffect } from "react";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import { Link } from "wasp/client/router";
import "../styles/WelcomePage.css";

export function WelcomePage() {
    useEffect(() => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px",
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                }
            });
        }, observerOptions);

        // Observe all scroll-trigger elements
        const scrollTriggerElements = document.querySelectorAll(".scroll-trigger");
        scrollTriggerElements.forEach((el) => observer.observe(el));

        // Cleanup observer on unmount
        return () => {
            scrollTriggerElements.forEach((el) => observer.unobserve(el));
        };
    }, []);

    return (
        <div className="welcome-page">
            {/* GitHub Badge - Fixed Position */}
            <div className="github-badge-corner">
                <a
                    href="https://github.com/WASD2HJKL/Non-Linear-Chatbot/stargazers"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View GitHub Stars"
                >
                    <img
                        src="https://img.shields.io/github/stars/WASD2HJKL/Non-Linear-Chatbot?style=for-the-badge&logo=github&label=Stars&logoColor=white&color=ffda65"
                        alt="GitHub Stars"
                    />
                </a>
            </div>

            {/* Hero Section */}
            <Container fluid className="hero-background py-5">
                <Container className="hero-animation">
                    <Row className="justify-content-center text-center py-5">
                        <Col lg={8}>
                            <h1 className="display-4 fw-bold mb-4 hero-title">Your Conversations, Your Way</h1>
                            <p className="lead mb-4 hero-subtitle">
                                Break free from linear chat. Branch, explore, and organize your AI conversations
                                naturally.
                            </p>
                            <div className="hero-buttons">
                                <Link to="/signup" className="btn btn-primary btn-lg me-3 btn-enhanced">
                                    🚀 Start Exploring
                                </Link>
                                <Link to="/login" className="btn btn-outline-primary btn-lg btn-enhanced">
                                    Welcome Back
                                </Link>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </Container>

            {/* Features Section */}
            <Container className="py-5 scroll-trigger">
                <h2 className="text-center mb-5 scroll-trigger">Why Choose Non-Linear Chatbot?</h2>
                <Row className="gx-4 gy-4 justify-content-center">
                    <Col md={6} lg={4} className="card-animation">
                        <Card className="h-100 feature-card">
                            <Card.Body className="text-center">
                                <div className="mb-3 float-icon" style={{ fontSize: "2.5rem" }}>
                                    🌳
                                </div>
                                <Card.Title>Branch Anywhere, Anytime</Card.Title>
                                <Card.Text>
                                    Explore multiple ideas without losing context. Fork conversations at any point and
                                    keep your main discussion focused.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} lg={4} className="card-animation">
                        <Card className="h-100 feature-card">
                            <Card.Body className="text-center">
                                <div className="mb-3 float-icon" style={{ fontSize: "2.5rem" }}>
                                    🧠
                                </div>
                                <Card.Title>Think Naturally</Card.Title>
                                <Card.Text>
                                    No more linear constraints. Let your mind wander and explore. AI that adapts to how
                                    humans actually think.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} lg={4} className="card-animation">
                        <Card className="h-100 feature-card">
                            <Card.Body className="text-center">
                                <div className="mb-3 float-icon" style={{ fontSize: "2.5rem" }}>
                                    ⚡
                                </div>
                                <Card.Title>Work in Parallel</Card.Title>
                                <Card.Text>
                                    Send multiple requests simultaneously. No more waiting or forgetting ideas.
                                    Visualize all your conversation threads.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} lg={4} className="card-animation">
                        <Card className="h-100 feature-card">
                            <Card.Body className="text-center">
                                <div className="mb-3 float-icon" style={{ fontSize: "2.5rem" }}>
                                    🎯
                                </div>
                                <Card.Title>One Session, Infinite Possibilities</Card.Title>
                                <Card.Text>
                                    No more juggling multiple tabs or sessions. No more searching through endless chat
                                    history. Everything you need in one organized conversation tree.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} lg={4} className="card-animation">
                        <Card className="h-100 feature-card">
                            <Card.Body className="text-center">
                                <div className="mb-3 float-icon" style={{ fontSize: "2.5rem" }}>
                                    📝
                                </div>
                                <Card.Title>Smart Node Summaries</Card.Title>
                                <Card.Text>
                                    AI-generated summaries for each conversation node help you navigate complex
                                    discussions and quickly understand key points at a glance.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} lg={4} className="card-animation">
                        <Card className="h-100 feature-card">
                            <Card.Body className="text-center">
                                <div className="mb-3 float-icon" style={{ fontSize: "2.5rem" }}>
                                    📏
                                </div>
                                <Card.Title>Customizable Node Widths</Card.Title>
                                <Card.Text>
                                    Resize conversation nodes from 150px to 800px to fit your content perfectly. Drag
                                    the edges to adjust width and optimize your reading experience.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6} lg={4} className="card-animation">
                        <Card className="h-100 feature-card">
                            <Card.Body className="text-center">
                                <div className="mb-3 float-icon" style={{ fontSize: "2.5rem" }}>
                                    🔄
                                </div>
                                <Card.Title>Smart Auto Layout</Card.Title>
                                <Card.Text>
                                    Intelligent node positioning with context-aware spacing that prevents overlaps. Auto
                                    Layout uses advanced algorithms to organize your conversation tree beautifully.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>

            {/* Coming Soon Section */}
            <Container className="py-5 scroll-trigger">
                <h3 className="text-center mb-4 scroll-trigger">Coming Soon</h3>
                <ul className="list-unstyled text-center text-muted">
                    <li className="coming-soon-item">🎨 Better Export Options</li>
                    <li className="coming-soon-item">⚡ Enhanced Auto Layout Algorithm</li>
                    <li className="coming-soon-item">🔝 Top-Button Tree Growing Direction</li>
                    <li className="coming-soon-item">📌 Pinned conversations for quick access</li>
                    <li className="coming-soon-item">📁 File uploads with automatic tree generation</li>
                </ul>
            </Container>

            {/* Footer */}
            <Container className="py-5 text-center scroll-trigger">
                <p className="text-muted mb-4">
                    Ready to revolutionize your AI conversations?{" "}
                    <Link to="/signup" className="btn-enhanced">
                        Sign up now
                    </Link>{" "}
                    or{" "}
                    <Link to="/login" className="btn-enhanced">
                        log in
                    </Link>{" "}
                    to get started.
                </p>
                <div className="d-flex justify-content-center align-items-center flex-wrap gap-3">
                    <span className="text-muted small">Open Source Project</span>
                    <a
                        href="https://github.com/WASD2HJKL/Non-Linear-Chatbot"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="badge bg-dark text-decoration-none btn-enhanced"
                        style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
                    >
                        <span className="me-2">🐙</span>
                        View on GitHub
                    </a>
                    <a
                        href="https://github.com/WASD2HJKL/Non-Linear-Chatbot/issues"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="badge bg-secondary text-decoration-none btn-enhanced"
                        style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
                    >
                        <span className="me-2">🐛</span>
                        Report Issues
                    </a>
                </div>
            </Container>
        </div>
    );
}
