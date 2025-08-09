import React, { useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import useStorage from "../hook/useStorage";
import configService from "../services/configService";

function Settings({ show, onHide, onApply }) {
    // Get available providers and models from config
    const { providers, defaultProvider, defaultModel } = configService.getApiConfig();

    // Load saved settings from localStorage or use defaults
    const [selectedProvider, setSelectedProvider] = useStorage("provider", defaultProvider);
    const [selectedModel, setSelectedModel] = useStorage("model", defaultModel);

    // Local state for form
    const [tempProvider, setTempProvider] = useState(selectedProvider);
    const [tempModel, setTempModel] = useState(selectedModel);

    // Get models for the currently selected provider
    const getModelsForProvider = (providerId) => {
        const provider = providers.find((p) => p.id === providerId);
        return provider ? provider.models : [];
    };

    // Handle provider change and set first model as default
    const handleProviderChange = (e) => {
        const newProvider = e.target.value;
        setTempProvider(newProvider);

        // Set first model of the new provider as selected
        const models = getModelsForProvider(newProvider);
        if (models.length > 0) {
            setTempModel(models[0].id);
        }
    };

    // Apply settings
    const handleApply = () => {
        // Save settings to localStorage
        setSelectedProvider(tempProvider);
        setSelectedModel(tempModel);

        // Notify parent component (API key is server-managed now)
        if (onApply) {
            onApply({
                apiKey: "server-managed",
                provider: tempProvider,
                model: tempModel,
            });
        }

        onHide();
    };

    // Reset form when modal opens
    React.useEffect(() => {
        if (show) {
            setTempProvider(selectedProvider);
            setTempModel(selectedModel);
        }
    }, [show, selectedProvider, selectedModel]);

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>API Settings</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Alert variant="info">
                    API keys are now managed securely on the server. You only need to configure your preferred provider
                    and model.
                </Alert>

                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>API Provider</Form.Label>
                        <Form.Select value={tempProvider} onChange={handleProviderChange}>
                            {providers.map((provider) => (
                                <option key={provider.id} value={provider.id}>
                                    {provider.name}
                                </option>
                            ))}
                        </Form.Select>
                        <Form.Text className="text-muted">Select your preferred AI service provider.</Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Model</Form.Label>
                        <Form.Select value={tempModel} onChange={(e) => setTempModel(e.target.value)}>
                            {getModelsForProvider(tempProvider).map((model) => (
                                <option key={model.id} value={model.id}>
                                    {model.name}
                                </option>
                            ))}
                        </Form.Select>
                        <Form.Text className="text-muted">Select the AI model to use for chat completions.</Form.Text>
                    </Form.Group>
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleApply}>
                    Apply Settings
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default Settings;
