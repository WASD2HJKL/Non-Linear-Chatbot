import { SignupForm } from "wasp/client/auth";
import { Link } from "wasp/client/router";
import { Container, Card, Row, Col } from "react-bootstrap";

export function SignupPage() {
    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={6} lg={4}>
                    <Card>
                        <Card.Body>
                            <Card.Title className="text-center mb-4">
                                <h2>Sign up for Non-Linear Chatbot</h2>
                            </Card.Title>
                            <SignupForm
                                additionalSignupFields={[
                                    {
                                        name: "firstName",
                                        label: "First Name",
                                        type: "input",
                                        validations: {
                                            required: false,
                                        },
                                    },
                                    {
                                        name: "lastName",
                                        label: "Last Name",
                                        type: "input",
                                        validations: {
                                            required: false,
                                        },
                                    },
                                    {
                                        name: "username",
                                        label: "Username",
                                        type: "input",
                                        validations: {
                                            required: false,
                                        },
                                    },
                                ]}
                            />
                            <div className="text-center mt-3">
                                <p>
                                    Already have an account? <Link to="/login">Log in</Link>
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
