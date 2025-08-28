import React from "react";
import { Button } from "react-bootstrap";

function ExportButton({ onExport }) {
    const handleExportClick = () => {
        if (onExport) {
            onExport();
        }
    };

    return (
        <Button
            variant="secondary"
            size="sm"
            onClick={handleExportClick}
            title="Export conversation map"
            className="me-2"
        >
            Export
        </Button>
    );
}

export default ExportButton;
