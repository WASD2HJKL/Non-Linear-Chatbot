# Non-Linear Chatbot 🌳

[![GitHub stars](https://img.shields.io/github/stars/WASD2HJKL/Non-Linear-Chatbot?style=for-the-badge&logo=github&label=Stars&logoColor=white&color=ffda65)](https://github.com/WASD2HJKL/Non-Linear-Chatbot/stargazers)

A revolutionary conversational AI application that breaks free from traditional linear chat interfaces. Create branching conversation trees, explore multiple dialogue paths, and visualize your conversations as interactive node graphs.

![Version](https://img.shields.io/badge/version-0.0.1-blue)
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

### 🤖 AI Integration

- Server-side OpenAI streaming for secure API key management
- Support for multiple GPT-4o model variants
- Real-time response streaming with queue-based NDJSON parsing
- Configurable model selection through user-friendly settings

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
- OpenAI API key

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
   OPENAI_API_KEY=your_openai_api_key_here
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
│   │   └── openaiStream.ts # Streaming endpoint
│   ├── services/          # Business logic services
│   ├── styles/            # CSS files
│   └── utils/             # Utility functions
└── public/                # Static assets
```

### Key Design Patterns

- **Node-based conversation storage**: Each message pair is a node in the tree
- **Centralized storage service**: Consistent localStorage handling with migration support
- **Queue-based streaming**: Robust NDJSON parsing preventing data loss
- **Component modularity**: Reusable UI components with clear separation of concerns

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
