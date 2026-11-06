#!/usr/bin/env bash
# =============================================================================
# ALPINEX — Official Self-Hosted & CLI Installer
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/alpinex/alpinex/main/scripts/install.sh | bash
#
# Custom Options:
#   curl -fsSL ... | bash -s -- --dir /opt/alpinex --port 3000
#   curl -fsSL ... | bash -s -- --cli-only
# =============================================================================

set -e

# ANSI Color codes
BOLD="\033[1m"
CYAN="\033[36m"
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
RESET="\033[0m"

# Default configuration
INSTALL_DIR="${HOME}/.alpinex"
WEB_PORT="3000"
API_PORT="8080"
CLI_ONLY=false
NON_INTERACTIVE=false
REPO_RAW_URL="https://raw.githubusercontent.com/egichandrap/ALPINEX/main"

# Parse CLI arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --dir) INSTALL_DIR="$2"; shift ;;
    --port) WEB_PORT="$2"; shift ;;
    --api-port) API_PORT="$2"; shift ;;
    --cli-only) CLI_ONLY=true ;;
    -y|--yes) NON_INTERACTIVE=true ;;
    -h|--help)
      echo "ALPINEX Installer"
      echo "Options:"
      echo "  --dir <path>       Target installation directory (default: ~/.alpinex)"
      echo "  --port <port>      Web Dashboard port (default: 3000)"
      echo "  --api-port <port>  REST API port (default: 8080)"
      echo "  --cli-only         Install only the standalone CLI binary"
      echo "  -y, --yes          Non-interactive automatic mode"
      exit 0
      ;;
    *) echo -e "${RED}Unknown option: $1${RESET}"; exit 1 ;;
  esac
  shift
done

# Print Banner
echo -e "${CYAN}${BOLD}"
cat << "EOF"
   ___    __    ____  _____ _   ________  __
  /   |  / /   / __ \/  _/ | / / ____/ |/ /
 / /| | / /   / /_/ // / /  |/ / __/  |   / 
/ ___ |/ /___/ ____// / / /|  / /___ /   |  
/_/  |_/_____/_/   /___//_/ |_/_____//_/|_|  
EOF
echo -e "${RESET}"
echo -e "${BOLD}Open-Source API Testing & Performance Engineering Platform${RESET}"
echo -e "============================================================"
echo ""

# Helper logging
info() { echo -e "${CYAN}[INFO]${RESET} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${RESET} $1"; }
warn() { echo -e "${YELLOW}[WARN]${RESET} $1"; }
error() { echo -e "${RED}[ERROR]${RESET} $1" >&2; exit 1; }

# System Detection
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$ARCH" in
  x86_64|amd64) ARCH="amd64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *) error "Unsupported CPU architecture: $ARCH" ;;
esac

info "Detected System: ${BOLD}${OS}/${ARCH}${RESET}"

# Function to generate cryptographically secure random string
generate_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 16
  else
    # Fallback pseudo-random
    head -c 32 /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | head -c 32
  fi
}

# -----------------------------------------------------------------------------
# Mode 1: CLI-Only Installation
# -----------------------------------------------------------------------------
if [ "$CLI_ONLY" = true ]; then
  info "Installing ALPINEX CLI binary..."
  
  TARGET_BIN_DIR="/usr/local/bin"
  if [ ! -w "$TARGET_BIN_DIR" ]; then
    TARGET_BIN_DIR="${HOME}/.local/bin"
    mkdir -p "$TARGET_BIN_DIR"
  fi

  info "Downloading pre-compiled binary for ${OS}/${ARCH}..."
  # Download pre-built CLI from releases (or local build fallback)
  DOWNLOAD_URL="https://github.com/egichandrap/ALPINEX/releases/latest/download/alpinex-${OS}-${ARCH}"
  
  if curl -sLf "$DOWNLOAD_URL" -o "${TARGET_BIN_DIR}/alpinex" 2>/dev/null; then
    chmod +x "${TARGET_BIN_DIR}/alpinex"
  else
    # If release asset not yet published, check if running in local source tree
    if [ -f "./bin/alpinex" ]; then
      cp "./bin/alpinex" "${TARGET_BIN_DIR}/alpinex"
      chmod +x "${TARGET_BIN_DIR}/alpinex"
    else
      warn "Pre-built binary release not found online; attempting local go build..."
      if command -v go >/dev/null 2>&1; then
        go install github.com/egichandrap/ALPINEX/cmd/cli@latest
        TARGET_BIN_DIR="$(go env GOPATH)/bin"
      else
        error "Unable to download binary and Go compiler is not installed."
      fi
    fi
  fi

  success "ALPINEX CLI installed to: ${BOLD}${TARGET_BIN_DIR}/alpinex${RESET}"
  echo ""
  echo "Verify installation:"
  echo -e "  ${BOLD}alpinex version${RESET}"
  exit 0
fi

# -----------------------------------------------------------------------------
# Mode 2: Full Docker Self-Hosted Platform Installation
# -----------------------------------------------------------------------------
info "Verifying prerequisites..."

# 1. Check Docker
if ! command -v docker >/dev/null 2>&1; then
  echo ""
  error "Docker is required but not installed.\nPlease install Docker: https://docs.docker.com/get-docker/"
fi

# 2. Check Docker Compose (v2 plugin or standalone)
if docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DOCKER_COMPOSE_CMD="docker-compose"
else
  error "Docker Compose is required but not installed.\nPlease install Docker Compose: https://docs.docker.com/compose/install/"
fi

info "Found Docker Engine: $(docker --version)"
info "Found Docker Compose: $($DOCKER_COMPOSE_CMD version --short 2>/dev/null || echo 'v2')"

# Prepare Directory
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"
info "Installation directory: ${BOLD}${INSTALL_DIR}${RESET}"

# Generate Production .env if not exists
if [ ! -f "$INSTALL_DIR/.env" ]; then
  info "Generating secure cryptographic secrets..."
  APP_SECRET=$(generate_secret)
  APP_ENCRYPTION_KEY=$(generate_secret)
  DB_PASSWORD=$(generate_secret)

  cat << EOF > "$INSTALL_DIR/.env"
# ALPINEX Configuration (Generated $(date -u +"%Y-%m-%dT%H:%M:%SZ"))
APP_ENV=production
APP_PORT=${API_PORT}
APP_SECRET=${APP_SECRET}
APP_ENCRYPTION_KEY=${APP_ENCRYPTION_KEY}

# Default Administrator Credentials
DEFAULT_ADMIN_USER=admin
DEFAULT_ADMIN_PASSWORD=admin

# PostgreSQL Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=alpinex
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=alpinex_db
DB_SSL_MODE=disable

# Redis Broker
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# Security & Safeguards
SECURITY_ALLOW_PRIVATE_IPS=false
QUOTA_MAX_VUS=1000
QUOTA_MAX_DURATION_MINUTES=60
METRICS_RETENTION_DAYS=30
LOG_LEVEL=info
EOF
  success "Configured .env with encrypted master keys."
else
  info "Existing .env found. Keeping existing credentials."
fi

# Download or Copy docker-compose.yml
info "Setting up multi-container architecture..."

# If running within the repo directory, use local file, otherwise fetch from GitHub
if [ -f "./docker-compose.yml" ] && [ "$(pwd)" != "$INSTALL_DIR" ]; then
  cp "./docker-compose.yml" "$INSTALL_DIR/docker-compose.yml"
else
  cat << EOF > "$INSTALL_DIR/docker-compose.yml"
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: alpinex-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: \${DB_USER:-alpinex}
      POSTGRES_PASSWORD: \${DB_PASSWORD:-alpinex_secret}
      POSTGRES_DB: \${DB_NAME:-alpinex_db}
    ports:
      - "\${DB_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${DB_USER:-alpinex} -d \${DB_NAME:-alpinex_db}"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: alpinex-redis
    restart: unless-stopped
    ports:
      - "\${REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    image: alpinex/api:latest
    build:
      context: https://github.com/egichandrap/ALPINEX.git#main
      dockerfile: deploy/Dockerfile.api
    container_name: alpinex-api
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    env_file:
      - .env
    ports:
      - "${API_PORT}:8080"

  worker:
    image: alpinex/worker:latest
    build:
      context: https://github.com/egichandrap/ALPINEX.git#main
      dockerfile: deploy/Dockerfile.worker
    container_name: alpinex-worker
    restart: unless-stopped
    depends_on:
      redis:
        condition: service_healthy
      api:
        condition: service_started
    env_file:
      - .env

  web:
    image: alpinex/web:latest
    build:
      context: https://github.com/egichandrap/ALPINEX.git#main
      dockerfile: deploy/Dockerfile.web
    container_name: alpinex-web
    restart: unless-stopped
    ports:
      - "${WEB_PORT}:80"
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
EOF
fi

# Launch Containers
info "Starting ALPINEX containers via Docker Compose..."
$DOCKER_COMPOSE_CMD up -d

# Create global wrapper script 'alpinex' in user PATH if writable
BIN_WRAPPER="/usr/local/bin/alpinex"
if [ ! -w "/usr/local/bin" ]; then
  mkdir -p "${HOME}/.local/bin"
  BIN_WRAPPER="${HOME}/.local/bin/alpinex"
fi

cat << EOF > "$BIN_WRAPPER"
#!/usr/bin/env bash
# ALPINEX Management CLI Wrapper
COMPOSE_DIR="${INSTALL_DIR}"

case "\$1" in
  start)
    cd "\$COMPOSE_DIR" && ${DOCKER_COMPOSE_CMD} up -d
    ;;
  stop)
    cd "\$COMPOSE_DIR" && ${DOCKER_COMPOSE_CMD} stop
    ;;
  restart)
    cd "\$COMPOSE_DIR" && ${DOCKER_COMPOSE_CMD} restart
    ;;
  status)
    cd "\$COMPOSE_DIR" && ${DOCKER_COMPOSE_CMD} ps
    ;;
  logs)
    shift
    cd "\$COMPOSE_DIR" && ${DOCKER_COMPOSE_CMD} logs -f "\$@"
    ;;
  down)
    cd "\$COMPOSE_DIR" && ${DOCKER_COMPOSE_CMD} down
    ;;
  health)
    curl -sS "http://localhost:${API_PORT}/health"
    echo ""
    ;;
  *)
    echo "ALPINEX Management Utility"
    echo "Usage: alpinex {start|stop|restart|status|logs|health|down}"
    ;;
esac
EOF
chmod +x "$BIN_WRAPPER"

echo ""
echo -e "${GREEN}${BOLD}🎉 ALPINEX is successfully installed and running!${RESET}"
echo -e "============================================================"
echo -e "  🌐 ${BOLD}Web Dashboard:${RESET}  http://localhost:${WEB_PORT}"
echo -e "  ⚙️  ${BOLD}REST API:${RESET}       http://localhost:${API_PORT}/api/v1"
echo -e "  🩺 ${BOLD}Health Check:${RESET}   http://localhost:${API_PORT}/health"
echo -e "  🔑 ${BOLD}Default Admin:${RESET}  ${CYAN}admin${RESET} / ${CYAN}admin${RESET}"
echo -e "  ℹ️  ${BOLD}Credentials:${RESET}    Configurable anytime in ${INSTALL_DIR}/.env"
echo -e "============================================================"
echo ""
echo -e "${BOLD}Management Commands:${RESET}"
echo -e "  Check status:   ${CYAN}alpinex status${RESET}"
echo -e "  View live logs: ${CYAN}alpinex logs${RESET}"
echo -e "  Stop platform:  ${CYAN}alpinex stop${RESET}"
echo -e "  Start platform: ${CYAN}alpinex start${RESET}"
echo -e "  Uninstall:      ${CYAN}cd ${INSTALL_DIR} && ${DOCKER_COMPOSE_CMD} down -v${RESET}"
echo ""
