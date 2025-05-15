# Non-Linear Chatbot

While learning new concepts using large language models like ChatGPT, I often found myself overwhelmed when a single response introduced multiple unfamiliar ideas. Although follow-up questions can help clarify these concepts, they often lead to even more new terms—creating a recursive loop of confusion.

Currently, ChatGPT conversations are largely linear. While you can shift directions mid-conversation, the interface isn't particularly user-friendly when it comes to tracking branching discussions.

This project implements a solution where each question-response pair is treated as a node, allowing the conversation to grow like a tree. In this model, users can ask multiple follow-up questions based on the same response, and easily navigate the resulting conversation graph.

## Features

-   **Split-screen interface**: Canvas visualization on the left, text chat on the right
-   **Node-based conversation tree**: Each user-assistant exchange forms a node in the tree
-   **Branch navigation**: Click any node to resume conversation from that point
-   **Multiple conversation paths**: Explore different directions from the same starting point
-   **Configurable chat settings**: Easily modify the prompt and initial message through a config file
-   **Multiple API providers**: Switch between different AI providers (OpenAI, Anthropic)
-   **Model selection**: Choose from various models for each provider

## Demo

![demo](./assets/gif/chatbot-demo.gif)

## Configuration

### Chat Configuration

The chatbot's behavior can be configured by editing the `src/config/chatConfig.json` file:

```json
{
    "chatConfig": {
        "prompt": "You are a helpful assistant. Your goal is to help the user with whatever queries they have.",
        "initialMessage": "Hello! How can I help you today?"
    }
}
```

-   **prompt**: The system instruction given to the AI
-   **initialMessage**: The first message displayed from the assistant

### API Configuration

Users can configure their API settings through the user interface by clicking the "API Settings" button:

-   **Choose API Provider**: Select between different AI providers (OpenAI, Anthropic)
-   **Select Model**: Choose specific models from the selected provider
-   **Set API Key**: Enter your API key for authentication

API settings are saved in browser localStorage for convenience and security.

## How It Works

1. The left side displays a visual tree of your conversation, with each node representing a user-assistant exchange
2. The right side shows the active conversation thread where you interact with the AI
3. To start a new branch from any point in the conversation:
    - Click on a node in the canvas
    - The text interface will update to show all messages up to that point
    - Type your new question to branch from that point
4. The tree structure automatically updates as you add new branches

## Benefits

This non-linear approach addresses two key issues:

1. Users can easily revisit earlier parts of a conversation after following several branches
2. Context is maintained efficiently, reducing computational overhead while preserving relevant information

## Installation

```bash
# Install dependencies
npm install reactflow react-bootstrap react-markdown react-spinners openai react-bootstrap-icons

# Start the development server
npm run dev
```

## API Keys

To use this application, you'll need to provide your own API keys:

-   **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/)
-   **Anthropic API Key**: Get from [Anthropic Console](https://console.anthropic.com/)

The API keys are stored only in your browser's localStorage and are never sent to any server except the respective API provider's endpoints.

## Implementation Details

The application consists of several key components:

1. **TextAppManager**: Orchestrates the overall application, managing the conversation tree and active branch
2. **ConversationCanvas**: Visualizes the conversation tree using ReactFlow
3. **ConversationNode**: Displays individual exchanges as nodes in the tree
4. **TextApp**: Handles the actual conversation with the AI
5. **Settings**: Manages API provider and model selection
6. **apiClientService**: Handles API client creation and management for different providers

The conversation structure is stored as a tree where:

-   Each branch contains a sequence of messages
-   Branches inherit context from their parent branches
-   New branches are created when continuing from a selected node

## Layout Features

-   **Auto Layout**: Automatically arrange nodes in a tree structure
-   **Drag and Drop**: Manually position nodes by dragging their handles
-   **Position Persistence**: Node positions are preserved between updates
-   **Expandable Nodes**: Expand nodes to view full content of long messages

## Usage

1. Set up your API key in the settings
2. Start a conversation
3. Ask follow-up questions as normal
4. To explore a different direction:
    - Click on any previous node in the canvas
    - The conversation will reset to that point
    - Type a new question to create a new branch
5. Navigate between branches by clicking different nodes
6. Try different AI models by changing settings
7. Start a fresh conversation using the "New Chat" button

---

This project demonstrates a more intuitive way to explore complex topics with AI assistants, allowing for non-linear learning and discovery.
