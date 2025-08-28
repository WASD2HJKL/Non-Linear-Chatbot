import React from "react";
import { Modal, Button } from "react-bootstrap";

function DeleteConfirmationModal({ show, onHide, onConfirm, nodeSummary }) {
    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Confirm Deletion</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>Are you sure you want to delete this node?</p>
                {nodeSummary && (
                    <div className="alert alert-info">
                        <strong>Node Summary:</strong> {nodeSummary}
                    </div>
                )}
                <div className="alert alert-warning">
                    <strong>Warning:</strong> This will also delete all descendant nodes in the conversation tree. This
                    action cannot be undone.
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

export default DeleteConfirmationModal;
