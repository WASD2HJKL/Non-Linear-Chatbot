import { VerifyEmailForm } from "wasp/client/auth";
import { Container, Card, Row, Col } from "react-bootstrap";

export function EmailVerificationPage() {
    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={6} lg={4}>
                    <Card>
                        <Card.Body>
                            <Card.Title className="text-center mb-4">
                                <h2>Verify Your Email</h2>
                            </Card.Title>
                            <p className="text-center mb-4">
                                Please check your email and click the verification link to activate your account.
                            </p>
                            <VerifyEmailForm />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
