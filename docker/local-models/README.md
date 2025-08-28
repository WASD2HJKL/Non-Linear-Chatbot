# Local AI Models with Docker

This directory contains Docker configuration for running local AI models with the Non-Linear Chatbot application.

## Prerequisites

- Docker and Docker Compose installed
- At least 4GB free disk space for models
- 8GB+ RAM recommended for smooth operation

## Quick Start

1. **Start Ollama service:**

    ```bash
    cd docker/local-models
    docker-compose up -d
    ```

2. **Wait for service to be healthy (may take 1-2 minutes):**

    ```bash
    docker-compose ps
    ```

3. **Download phi3-mini model:**

    ```bash
    docker-compose exec ollama ollama pull phi3:mini
    ```

4. **Verify model is available:**

    ```bash
    docker-compose exec ollama ollama list
    ```

5. **Configure environment variables in your `.env.server`:**

    ```
    OLLAMA_API_KEY=local-dummy-key
    ```

6. **Start your Non-Linear Chatbot application and select "Phi-4 Mini (Local)" from the model dropdown**

## Management Commands

### Start/Stop Services

```bash
# Start services
docker-compose up -d

# Stop services (keeps data)
docker-compose down

# Stop services and remove data
docker-compose down -v
```

### Model Management

```bash
# List available models
docker-compose exec ollama ollama list

# Download additional models
docker-compose exec ollama ollama pull llama3.2:3b

# Remove a model
docker-compose exec ollama ollama rm phi3:mini
```

### Monitoring

```bash
# View logs
docker-compose logs -f ollama

# Check service health
docker-compose ps

# Monitor resource usage
docker stats non-linear-chatbot-ollama
```

## Troubleshooting

### Service Won't Start

- Check if port 11434 is already in use: `lsof -i :11434`
- Ensure Docker has sufficient memory allocated
- Check logs: `docker-compose logs ollama`

### Model Download Fails

- Verify internet connection
- Check available disk space
- Try pulling model manually: `docker-compose exec ollama ollama pull phi3:mini`

### Application Can't Connect

- Verify Ollama is running: `curl http://localhost:11434/api/version`
- Check firewall settings
- Ensure OLLAMA_API_KEY is set in .env.server

### Performance Issues

- Allocate more memory to Docker
- Consider using smaller models like phi3:mini for development
- Monitor system resources during model inference

## Supported Models

Currently tested with:

- **phi3:mini** - Lightweight model, good for development (recommended)

Additional models can be added by:

1. Pulling the model: `docker-compose exec ollama ollama pull MODEL_NAME`
2. Adding to application configuration in `src/config.js`

## Data Persistence

Models and configuration are stored in the `ollama_data` Docker volume. To completely reset:

```bash
docker-compose down -v
docker volume rm local-models_ollama_data
```

## Security Notes

- This setup is intended for development only
- Local models don't require real API keys (use dummy values)
- Ollama service is exposed on localhost only
- Production deployments should use cloud providers
