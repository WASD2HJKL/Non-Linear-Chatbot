# Non-Linear Chatbot

While learning new concepts using large language models like ChatGPT, I often found myself overwhelmed when a single response introduced multiple unfamiliar ideas. Although follow-up questions can help clarify these concepts, they often lead to even more new terms—creating a recursive loop of confusion.

Currently, ChatGPT conversations are largely linear. While you can shift directions mid-conversation, the interface isn't particularly user-friendly when it comes to tracking branching discussions.

This project implements a solution where each question-response pair is treated as a node, allowing the conversation to grow like a tree. In this model, users can ask multiple follow-up questions based on the same response, and easily navigate the resulting conversation graph.

## Features

- **Split-screen interface**: Canvas visualization on the left, text chat on the right
- **Node-based conversation tree**: Each user-assistant exchange forms a node in the tree
- **Branch navigation**: Click any node to resume conversation from that point
- **Multiple conversation paths**: Explore different directions from the same starting point
- **Persona switching**: Change the AI's personality while maintaining the tree structure

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
npm install reactflow react-bootstrap react-markdown react-spinners openai

# Set your OpenAI API key in .env file
VITE_OPENAI_API_KEY=your_api_key_here

# Start the development server
npm run dev
```

## Implementation Details

The application consists of several key components:

1. **TextAppManager**: Orchestrates the overall application, managing the conversation tree and active branch
2. **ConversationCanvas**: Visualizes the conversation tree using ReactFlow
3. **ConversationNode**: Displays individual exchanges as nodes in the tree
4. **TextApp**: Handles the actual conversation with the AI

The conversation structure is stored as a tree where:
- Each branch contains a sequence of messages
- Branches inherit context from their parent branches
- New branches are created when continuing from a selected node

## Usage

1. Start a conversation with the initial AI persona
2. Ask follow-up questions as normal
3. To explore a different direction:
   - Click on any previous node in the canvas
   - The conversation will reset to that point
   - Type a new question to create a new branch
4. Navigate between branches by clicking different nodes
5. Start a fresh conversation using the "New Chat" button

---

This project demonstrates a more intuitive way to explore complex topics with AI assistants, allowing for non-linear learning and discovery.
