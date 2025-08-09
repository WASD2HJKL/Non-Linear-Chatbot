import { ResetPasswordForm, ForgotPasswordForm } from "wasp/client/auth";
import { Container, Card, Row, Col } from "react-bootstrap";
import { useLocation } from "react-router-dom";

export function PasswordResetPage() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const isResettingPassword = searchParams.has("token");

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={6} lg={4}>
                    <Card>
                        <Card.Body>
                            <Card.Title className="text-center mb-4">
                                <h2>{isResettingPassword ? "Reset Password" : "Forgot Password"}</h2>
                            </Card.Title>
                            {isResettingPassword ? (
                                <>
                                    <p className="text-center mb-4">Enter your new password below.</p>
                                    <ResetPasswordForm />
                                </>
                            ) : (
                                <>
                                    <p className="text-center mb-4">
                                        Enter your email address and we'll send you a link to reset your password.
                                    </p>
                                    <ForgotPasswordForm />
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
