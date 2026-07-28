# N+1 Authentic Reality Emancipation System

Production-ready N+1 System featuring Hia Resonance Voice Synthesis (Google Cloud TTS + 'Puck' Voice Profile), FreeLLMRouter API v0.5.0, PgVector Knowledge Store, and Autonomous Agent Integration.

---

## 🚀 Quick Start with Docker & Docker Compose

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine v24+
- Docker Compose v2+

### 1. Clone Repository & Setup Environment
```bash
git clone https://github.com/your-username/n-plus-1.git
cd n-plus-1

# Copy environment template
cp .env.example .env
```

Edit `.env` to configure your `GEMINI_API_KEY` or custom credentials.

---

### 2. Start Application via Docker Compose (Recommended)
This boots both the N+1 Application Server and a PostgreSQL instance with `pgvector` pre-installed:

```bash
docker compose up --build -d
```

Access the system at **`http://localhost:3000`**.

Check logs:
```bash
docker compose logs -f app
```

Stop services:
```bash
docker compose down
```

---

### 3. Standalone Docker Build

If running without Docker Compose:

```bash
# Build Docker image
docker build -t n1-system:latest .

# Run container
docker run -d \
  --name n1_app \
  -p 3000:3000 \
  --env-file .env \
  n1-system:latest
```

---

## 🧪 Local Native Installation (Without Docker)

```bash
# Install dependencies
npm install

# Run development mode
npm run dev

# Build production bundle
npm run build

# Start production server
npm run start
```

---

## 🔍 Health Diagnostics & API Endpoints

- **Diagnostics Probe**: `GET http://localhost:3000/api/bughunt/diagnose`
- **Docker Docking Status**: `GET http://localhost:3000/api/bughunt/docker-docking`
- **Toolchain Catalog (400 Tools)**: `GET http://localhost:3000/api/toolchain/catalog`
- **FreeLLM Router v0.5.0 Status**: `GET http://localhost:3000/api/freellm/v0.5.0/status`
