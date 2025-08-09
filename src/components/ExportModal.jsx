import React, { useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";

const defaultSettings = {
    includeTruncatedTree: true,
    includeFullTree: true,
    includeUserInfo: true,
    includeTimestamps: true,
    includeConversationTitle: true,
    preserveUserPositioning: true,
    spacingDensity: "normal",
    exportFormat: "both",
    pageOrientation: "landscape",
};

function ExportModal({ show, onHide, conversationTree, nodePositions, user, onExport }) {
    const [settings, setSettings] = useState(defaultSettings);
    const [isExporting, setIsExporting] = useState(false);

    const handleSettingChange = (key, value) => {
        setSettings((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            if (onExport) {
                await onExport(settings);
            }
        } catch (error) {
            console.error("Export failed:", error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Export Conversation Map</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Form>
                    {/* Content Options */}
                    <h6 className="mb-3">Content Options</h6>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Check
                                type="checkbox"
                                label="Include interactive tree view"
                                checked={settings.includeTruncatedTree}
                                onChange={(e) => handleSettingChange("includeTruncatedTree", e.target.checked)}
                            />
                        </Col>
                        <Col md={6}>
                            <Form.Check
                                type="checkbox"
                                label="Include detailed conversation view"
                                checked={settings.includeFullTree}
                                onChange={(e) => handleSettingChange("includeFullTree", e.target.checked)}
                            />
                        </Col>
                    </Row>

                    {/* Layout Preferences */}
                    <h6 className="mb-3">Layout Preferences</h6>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Check
                                type="checkbox"
                                label="Preserve user positioning"
                                checked={settings.preserveUserPositioning}
                                onChange={(e) => handleSettingChange("preserveUserPositioning", e.target.checked)}
                            />
                        </Col>
                        <Col md={6}>
                            <Form.Label>Spacing density</Form.Label>
                            <Form.Select
                                value={settings.spacingDensity}
                                onChange={(e) => handleSettingChange("spacingDensity", e.target.value)}
                            >
                                <option value="compact">Compact</option>
                                <option value="normal">Normal</option>
                                <option value="wide">Wide</option>
                            </Form.Select>
                        </Col>
                    </Row>

                    {/* Metadata Options */}
                    <h6 className="mb-3">Metadata Options</h6>
                    <Row className="mb-3">
                        <Col md={4}>
                            <Form.Check
                                type="checkbox"
                                label="Include user info"
                                checked={settings.includeUserInfo}
                                onChange={(e) => handleSettingChange("includeUserInfo", e.target.checked)}
                            />
                        </Col>
                        <Col md={4}>
                            <Form.Check
                                type="checkbox"
                                label="Include timestamps"
                                checked={settings.includeTimestamps}
                                onChange={(e) => handleSettingChange("includeTimestamps", e.target.checked)}
                            />
                        </Col>
                        <Col md={4}>
                            <Form.Check
                                type="checkbox"
                                label="Include conversation title"
                                checked={settings.includeConversationTitle}
                                onChange={(e) => handleSettingChange("includeConversationTitle", e.target.checked)}
                            />
                        </Col>
                    </Row>

                    {/* Export Format */}
                    <h6 className="mb-3">Export Format</h6>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Label>Export format</Form.Label>
                            <Form.Select
                                value={settings.exportFormat}
                                onChange={(e) => handleSettingChange("exportFormat", e.target.value)}
                            >
                                <option value="html">HTML only</option>
                                <option value="pdf">Print-to-PDF instructions</option>
                                <option value="both">Both</option>
                            </Form.Select>
                        </Col>
                        <Col md={6}>
                            <Form.Label>Page orientation</Form.Label>
                            <Form.Select
                                value={settings.pageOrientation}
                                onChange={(e) => handleSettingChange("pageOrientation", e.target.value)}
                            >
                                <option value="portrait">Portrait</option>
                                <option value="landscape">Landscape</option>
                            </Form.Select>
                        </Col>
                    </Row>
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={isExporting}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={handleExport}
                    disabled={isExporting || (!settings.includeTruncatedTree && !settings.includeFullTree)}
                >
                    {isExporting ? "Exporting..." : "Export"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default ExportModal;
