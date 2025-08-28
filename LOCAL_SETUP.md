# Local AI Provider Setup

This guide explains how to set up local AI models for development with the Non-Linear Chatbot application.

## Overview

Local AI providers allow you to run AI models directly on your development machine instead of using cloud APIs. This is useful for:

- **Development without API costs** - No charges for experimenting with features
- **Offline development** - Work without internet connectivity
- **Privacy** - Keep conversations completely local
- **Learning** - Understand how local AI models work

**⚠️ Important:** Local AI providers are **development-only**. Production deployments use cloud providers only.

## Decision Tree: Choose Your Setup Path

### Quick Start (Recommended for beginners)

✅ **Use Docker Setup** if you:

- Want to get started quickly with minimal configuration
- Are comfortable with basic Docker commands
- Want a pre-configured setup that "just works"
- Don't need to customize the local model deployment

### Advanced Setup

🔧 **Use Manual Setup** if you:

- Already have Ollama or other local AI tools installed
- Want to customize your local model configuration
- Need to integrate with existing local AI infrastructure
- Prefer manual control over your development environment

---

## Docker Setup (Quick Start)

### Prerequisites

- Docker and Docker Compose installed ([Get Docker](https://docs.docker.com/get-docker/))
- At least 4GB free disk space for models
- 8GB+ RAM recommended for smooth operation

### Step 1: Start Local AI Services

Navigate to the project root and start the Ollama service:

```bash
cd docker/local-models
docker-compose up -d
```

Wait for the service to start (30-60 seconds):

```bash
docker-compose ps
```

You should see the Ollama container running and healthy.

### Step 2: Download AI Model

Download the phi3-mini model (this may take a few minutes):

```bash
docker-compose exec ollama ollama pull phi3:mini
```

Verify the model is available:

```bash
docker-compose exec ollama ollama list
```

### Step 3: Configure Environment

Add the local provider configuration to your `.env.server` file:

```bash
# Add this line to your .env.server
OLLAMA_API_KEY=local-dummy-key
```

### Step 4: Start Application

Start your Non-Linear Chatbot application:

```bash
wasp start
```

### Step 5: Use Local Model

1. Open your application in the browser
2. In the model selector dropdown, choose **"Phi-3 Mini (Local)"**
3. Start chatting with your local AI model!

### Managing Docker Services

```bash
# View logs
docker-compose logs -f ollama

# Stop services (keeps models)
docker-compose down

# Stop and remove all data
docker-compose down -v

# Check resource usage
docker stats non-linear-chatbot-ollama
```

---

## Manual Setup (Advanced)

### Prerequisites

- Ollama installed ([Get Ollama](https://ollama.ai/))
- Or another OpenAI-compatible local AI service

### Step 1: Install and Start Ollama

Follow the official Ollama installation guide for your platform.

Start Ollama service:

```bash
ollama serve
```

The service should be available at `http://localhost:11434`

### Step 2: Download AI Model

```bash
ollama pull phi3:mini
```

Verify installation:

```bash
ollama list
```

### Step 3: Configure Application

Add the local provider to your `.env.server`:

```bash
OLLAMA_API_KEY=local-dummy-key
```

The application will automatically detect the local Ollama service.

### Step 4: Custom Configuration (Optional)

To add additional models, edit `src/config.js`:

```javascript
{
    id: "ollama",
    name: "Ollama (Local)",
    url: "http://localhost:11434/v1",
    timeout: 60000,
    retries: 1,
    models: [
        {
            id: "phi3:mini",
            name: "Phi-3 Mini (Local)",
        },
        // Add your custom models here:
        {
            id: "llama3.2:3b",
            name: "Llama 3.2 3B (Local)",
        },
    ],
}
```

---

## Adding Additional Models

### Popular Models for Development

| Model          | Size | Memory | Use Case                      |
| -------------- | ---- | ------ | ----------------------------- |
| `phi3:mini`    | ~2GB | 4GB+   | Lightweight, good for testing |
| `llama3.2:3b`  | ~2GB | 4GB+   | Balanced performance          |
| `codellama:7b` | ~4GB | 8GB+   | Code generation               |
| `mistral:7b`   | ~4GB | 8GB+   | General purpose               |

### Adding a New Model

1. **Download the model:**

    ```bash
    # For Docker setup:
    docker-compose exec ollama ollama pull llama3.2:3b

    # For manual setup:
    ollama pull llama3.2:3b
    ```

2. **Add to application config** in `src/config.js`:

    ```javascript
    {
        id: "llama3.2:3b",
        name: "Llama 3.2 3B (Local)",
    },
    ```

3. **Restart application** and select the new model from dropdown

---

## Troubleshooting

### Docker Issues

**Service won't start:**

```bash
# Check if port is in use
lsof -i :11434

# View logs
docker-compose logs ollama

# Restart services
docker-compose restart
```

**Model download fails:**

```bash
# Check internet connection and disk space
df -h

# Try manual download
docker-compose exec ollama ollama pull phi3:mini
```

### Application Issues

**Model not appearing in dropdown:**

- Verify model is listed: `ollama list` or `docker-compose exec ollama ollama list`
- Check `src/config.js` configuration
- Restart application

**Connection errors:**

```bash
# Test Ollama API directly
curl http://localhost:11434/api/version

# Check environment variables
grep OLLAMA_API_KEY .env.server
```

**Performance issues:**

- Allocate more memory to Docker
- Try smaller models like `phi3:mini`
- Monitor system resources: `htop` or `docker stats`

### Common Error Messages

- **"Provider not found: ollama"** - Check `src/config.js` configuration
- **"Connection refused"** - Ollama service not running
- **"Model not found"** - Model not downloaded or incorrect name
- **"Out of memory"** - System needs more RAM or use smaller model

---

## Performance Tips

### System Requirements

- **Minimum:** 8GB RAM, 4GB free disk space
- **Recommended:** 16GB+ RAM, SSD storage
- **Model Size:** Larger models need more memory

### Optimization

1. **Use appropriate model sizes** for your hardware
2. **Close other applications** when running local models
3. **Monitor resource usage** with `htop` or Activity Monitor
4. **Use SSD storage** for better model loading times

---

## Security & Privacy

### Local Models Benefits

- **Complete privacy** - no data sent to external APIs
- **No API key exposure** - dummy keys only
- **Offline capability** - works without internet

### Development Only Warning

⚠️ **This setup is for development only:**

- Local models require significant computational resources
- Production deployments (Heroku, etc.) should use cloud providers
- Docker containers cannot run on most hosting platforms
- Local models are not suitable for production traffic

---

## Getting Help

### Documentation

- [Ollama Documentation](https://ollama.ai/docs)
- [Docker Documentation](https://docs.docker.com/)
- Main project [README.md](./README.md)

### Common Issues

- Check the troubleshooting section above
- Verify prerequisites are installed correctly
- Ensure sufficient system resources

### Support

- Open an issue on the project repository
- Include error messages and system information
- Specify which setup method you're using (Docker vs Manual)
