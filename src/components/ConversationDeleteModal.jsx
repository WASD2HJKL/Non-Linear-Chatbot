import React from "react";
import { Modal, Button } from "react-bootstrap";

function ConversationDeleteModal({ show, onHide, onConfirm, conversationTitle }) {
    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Confirm Deletion</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>Are you sure you want to delete this conversation?</p>
                {conversationTitle && (
                    <div className="alert alert-info">
                        <strong>Conversation:</strong> {conversationTitle}
                    </div>
                )}
                <div className="alert alert-warning">
                    <strong>Warning:</strong> This action cannot be undone. The conversation and all its messages will
                    be permanently deleted.
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Cancel
                </Button>
                <Button variant="danger" onClick={onConfirm}>
                    Delete
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default ConversationDeleteModal;
