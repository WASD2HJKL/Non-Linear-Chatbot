# Non-Linear Chatbot 🌳

[![GitHub stars](https://img.shields.io/github/stars/WASD2HJKL/Non-Linear-Chatbot?style=for-the-badge&logo=github&label=Stars&logoColor=white&color=ffda65)](https://github.com/WASD2HJKL/Non-Linear-Chatbot/stargazers)

[English](README.md) | [简体中文](README.zh-CN.md)

A revolutionary conversational AI application that breaks free from traditional linear chat interfaces. Create branching conversation trees, explore multiple dialogue paths, and visualize your conversations as interactive node graphs.


![Version](https://img.shields.io/badge/version-0.0.2-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen)
![Wasp](https://img.shields.io/badge/wasp-0.17.0-yellow)

## ✨ Features

### 🌿 Branching Conversations

- Fork conversations at any point to explore different dialogue paths
- Navigate between conversation branches seamlessly
- Preserve context while exploring alternative responses

### 📊 Interactive Visualization

- Real-time ReactFlow-powered conversation tree visualization
- Drag-and-drop nodes to organize your conversation map
- Resizable panels for optimal viewing experience
- Visual path highlighting for active conversation threads
- Expand All/Collapse All buttons for managing large conversation trees

### 🤖 AI Integration

- Multi-provider AI support with OpenAI-compatible API interfaces
- Server-side streaming for secure API key management
- Support for OpenAI, Gemini, OpenRouter, and other cloud providers
- **Local AI model support** for development (Ollama, phi3-mini, etc.)
- Local agent configuration for development environments
- Real-time response streaming with queue-based NDJSON parsing
- Configurable provider and model selection through user-friendly settings
- Unified error handling and normalization across providers

### 🎨 Modern UI/UX

- Clean, responsive Bootstrap-based design
- Dark/light theme support with zero-flicker switching
- Resizable panel layout with persistent state

### 📤 Export & Sharing

- Export entire conversation trees as interactive HTML files
- Preserve conversation structure and formatting
- Standalone files that work offline

## 🚀 Getting Started

### Prerequisites

- Node.js 22 or higher
- PostgreSQL database
- OpenAI API key (or compatible provider API key)
- **Optional:** Docker and Docker Compose for local AI models

> **Note**: This application supports any AI provider with OpenAI-compatible API endpoints. All providers must use the standard `Authorization: Bearer <api-key>` header format for authentication.

### Installation

1. **Clone the repository**

    ```bash
    git clone https://github.com/WASD2HJKL/Non-Linear-Chatbot.git
    cd Non-Linear-Chatbot
    ```

2. **Set up environment variables**

    ```bash
    cp .env.server.example .env.server
    ```

    Edit `.env.server` and add your configuration:

    ```env
    # AI Provider API Keys (convention-based naming)
    OPENAI_API_KEY=your_openai_api_key_here
    GEMINI_API_KEY=your_gemini_api_key_here
    HUGGINGFACE_API_KEY=hf_your_huggingface_token_here

    # Optional: Google OAuth
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    ```

3. **Start the development server**

   ```bash
   wasp start db
   wasp start
   ```

4. **Access the application**

    Open http://localhost:3000 in your browser

### Local AI Models (Development Only)

For development with local AI models instead of cloud APIs:

📖 **See [LOCAL_SETUP.md](./LOCAL_SETUP.md)** for comprehensive setup instructions

**Quick Start with Docker:**

```bash
# Start local Ollama service
cd docker/local-models
docker-compose up -d

# Download phi3-mini model
docker-compose exec ollama ollama pull phi3:mini

# Add to .env.server
echo "OLLAMA_API_KEY=local-dummy-key" >> .env.server
```

> ⚠️ **Development Only:** Local AI models are for development environments only. Production deployments use cloud providers.

### Production Build

```bash
wasp build
```

The build output will be in:

- Frontend: `.wasp/build/web-app/`
- Backend: `.wasp/build/server/`

## 🏗️ Architecture

### Project Structure

```
Non-Linear-Chatbot/
├── main.wasp              # Wasp configuration and routes
├── schema.prisma          # Database schema
├── src/
│   ├── components/        # React components
│   ├── contexts/          # React contexts (theme, etc.)
│   ├── hooks/             # Custom React hooks
│   ├── server/
│   │   ├── actions/       # Server-side mutations
│   │   ├── queries/       # Server-side queries
│   │   ├── middleware/    # Express middleware
│   │   └── openaiStream.ts # Multi-provider AI streaming endpoint
│   ├── services/          # Business logic services
│   ├── styles/            # CSS files
│   └── utils/             # Utility functions
└── public/                # Static assets
```

### Key Design Patterns

- **Node-based conversation storage**: Each message pair is a node in the tree
- **Multi-provider AI architecture**: Unified client factory supporting OpenAI-compatible APIs
- **Centralized storage service**: Consistent localStorage handling with migration support
- **Queue-based streaming**: Robust NDJSON parsing preventing data loss
- **Component modularity**: Reusable UI components with clear separation of concerns
- **Error normalization**: Standardized error handling across different AI providers

## ⚙️ Provider Configuration

The application supports multiple AI providers through a unified configuration system. All providers must support OpenAI-compatible API endpoints.

### Adding New Providers

Edit `src/config.js` to add new providers:

```javascript
providers: [
    {
        id: "openai",
        name: "OpenAI",
        url: "https://api.openai.com/v1",
        timeout: 30000,
        retries: 3,
        models: [
            { id: "gpt-4o", name: "GPT-4o" },
            { id: "gpt-4.1", name: "GPT-4.1" },
            { id: "gpt-5-chat-latest", name: "GPT-5 Chat" },
            { id: "gpt-4o-mini", name: "GPT-4o Mini" },
            { id: "gpt-4.1-mini", name: "GPT-4.1 Mini" },
            { id: "gpt-4.1-nano", name: "GPT-4.1 Nano (Thinking - may be buggy)" },
            { id: "gpt-5", name: "GPT-5 (Thinking)" },
            { id: "gpt-5-mini", name: "GPT-5 Mini" },
            { id: "o4-mini", name: "O4 Mini" },
        ],
    },
    {
        id: "huggingface",
        name: "Hugging Face",
        url: "https://router.huggingface.co/v1",
        timeout: 30000,
        retries: 3,
        models: [
            { id: "deepseek-ai/DeepSeek-R1:together", name: "DeepSeek R1" },
            { id: "meta-llama/Llama-3.2-90B-Vision-Instruct", name: "Llama 3.2 90B Vision" },
        ],
    },
];
```

### Requirements

- **API Compatibility**: Must support OpenAI's chat completions API format
- **Authentication**: Must use `Authorization: Bearer <api-key>` header format
- **Streaming**: Must support server-sent events for real-time responses
- **Error Format**: Errors will be automatically normalized to a standard format

### API Key Configuration

The application uses a convention-based system for API keys:

**Convention**: `{PROVIDER_ID}_API_KEY`

Examples:

- OpenAI: `OPENAI_API_KEY=sk-your_key_here`
- Gemini: `GEMINI_API_KEY=your_gemini_key_here`
- Hugging Face: `HUGGINGFACE_API_KEY=hf_your_token_here`

**Backward Compatibility**: If a provider-specific key is not found, the system falls back to `OPENAI_API_KEY`. This ensures existing setups continue working without changes.

## 🌐 Deployment

### Backend (Heroku)

The project includes Docker configuration for Heroku deployment:

```bash
heroku create your-app-name
heroku addons:create --app your-app-name heroku-postgresql:mini # Optional, if you want to use Heroku Database
                                                                # Otherwise you will have to set DATABASE_URL env
heroku config:set --app your-app-name OPENAI_API_KEY=sk-xxx     # Do the same for other environment variables
```

### Frontend (Netlify)

To deploy the frontend build to Netlify, manually create a project
at `Netlify` and set the GitHub Actions secrets, then run the pipeline.

### GitHub Actions CI/CD

The repository includes automated deployment workflow that:

- Builds and tests on push to main
- Deploys backend to Heroku
- Deploys frontend to Netlify

Required GitHub Secrets:

- `HEROKU_API_KEY`
- `HEROKU_APP_NAME`
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_NAME`
- `WASP_SERVER_URL`
- `WASP_WEB_CLIENT_URL`

## 🛠️ Development

### Database Migrations

```bash
wasp db migrate-dev    # Apply migrations
wasp db studio         # Open Prisma Studio
```

### Code Style

The project uses Prettier for code formatting:

- Tab width: 4 spaces
- Print width: 120 characters

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Commit Convention

This project follows conventional commits:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build process or auxiliary tool changes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Special thanks to Zhiyuan Shao (<shao.zhiyu@northeastern.edu>), who sparks the idea of mind map.

## 📧 Contact

Project Link: [https://github.com/WASD2HJKL/Non-Linear-Chatbot](https://github.com/WASD2HJKL/Non-Linear-Chatbot)
