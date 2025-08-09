import { LoginForm } from "wasp/client/auth";
import { Link } from "wasp/client/router";
import { Container, Card, Row, Col } from "react-bootstrap";

export function LoginPage() {
    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={6} lg={4}>
                    <Card>
                        <Card.Body>
                            <Card.Title className="text-center mb-4">
                                <h2>Login to Non-Linear Chatbot</h2>
                            </Card.Title>
                            <LoginForm />
                            <div className="text-center mt-3">
                                <p>
                                    Don't have an account? <Link to="/signup">Sign up</Link>
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
