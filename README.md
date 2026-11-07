# ALPINEX 🚀
### Open-Source API Testing & Performance Engineering Platform

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go)](https://go.dev/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://react.dev/)
[![Engine](https://img.shields.io/badge/Engine-Grafana_k6-7D64FF?logo=k6)](https://k6.io/)

ALPINEX is an open-source, self-hosted platform unifying API development, functional testing, scenario chaining, and load/stress testing powered by Grafana k6 into a single cohesive developer workspace.

---

## ⚡ 1-Line Quick Installation (No Git Clone Needed)

You can install and launch the entire ALPINEX platform with a single command without needing to clone the Git repository:

```bash
curl -fsSL https://raw.githubusercontent.com/egichandrap/ALPINEX/main/scripts/install.sh | bash
```

### What this installer does automatically:
1. Verifies system prerequisites (**Docker Engine** & **Docker Compose**).
2. Generates **cryptographically secure random secrets** (`APP_SECRET`, `APP_ENCRYPTION_KEY`, DB credentials).
3. Downloads the production orchestration template into `~/.alpinex`.
4. Starts all 5 core services (**PostgreSQL 16**, **Redis 7**, **API Control Plane**, **Execution Worker with Grafana k6**, and the **React Dashboard**).
5. Installs the global `alpinex` management command to your system `$PATH`.

---

### Custom Installation Options

You can customize the port or installation directory by passing arguments:

```bash
# Run Web UI on port 8080 and API on port 9000
curl -fsSL https://raw.githubusercontent.com/egichandrap/ALPINEX/main/scripts/install.sh | bash -s -- --port 8080 --api-port 9000

# Install to a custom directory (e.g., /opt/alpinex)
curl -fsSL https://raw.githubusercontent.com/egichandrap/ALPINEX/main/scripts/install.sh | bash -s -- --dir /opt/alpinex

# Install CLI binary only (no Docker / headless runner for CI/CD)
curl -fsSL https://raw.githubusercontent.com/egichandrap/ALPINEX/main/scripts/install.sh | bash -s -- --cli-only
```

---

## 🌐 Accessing Your Instance

Once installation finishes, access the services:

| Service | URL | Default Credentials |
|---|---|---|
| **Web Dashboard** | [http://localhost:3000](http://localhost:3000) | Username: `admin` / Password: `admin` |
| **REST API** | [http://localhost:8080/api/v1](http://localhost:8080/api/v1) | Bearer JWT Authentication |
| **Health Check** | [http://localhost:8080/health](http://localhost:8080/health) | Public |

### 🔒 Customizing / Changing Admin Credentials
You can easily customize or change your initial admin credentials in each installation:
1. Open the `.env` file (located in `~/.alpinex/.env` or your project root).
2. Edit the following variables:
   ```env
   DEFAULT_ADMIN_USER=your_custom_username
   DEFAULT_ADMIN_PASSWORD=your_custom_password
   ```
3. Restart ALPINEX to apply:
   ```bash
   alpinex restart
   ```

---

## 🛠️ Managing Your Platform

Use the installed `alpinex` helper utility:

```bash
# Check service health & container status
alpinex status

# View live container logs
alpinex logs

# Stop the platform
alpinex stop

# Start / Resume the platform
alpinex start

# Restart all containers
alpinex restart

# Perform health check
alpinex health
```

---

## 🗑️ Uninstallation

If you wish to completely uninstall ALPINEX and remove all persistent containers, database volumes, configuration files, and the CLI binary:

### 1-Line Clean Uninstall
```bash
[ -d "$HOME/.alpinex" ] && (cd "$HOME/.alpinex" && docker compose down -v) && rm -rf "$HOME/.alpinex" && rm -f /usr/local/bin/alpinex "$HOME/.local/bin/alpinex"
```

### Step-by-Step Breakdown:
1. **Stop containers and purge data volumes** (PostgreSQL & Redis):
   ```bash
   cd ~/.alpinex && docker compose down -v
   ```
2. **Remove configuration directory & generated secrets**:
   ```bash
   rm -rf ~/.alpinex
   ```
3. **Remove the global `alpinex` CLI binary / wrapper**:
   ```bash
   rm -f /usr/local/bin/alpinex ~/.local/bin/alpinex
   ```
4. *(Optional)* **Purge local Docker images**:
   ```bash
   docker rmi alpinex/api:latest alpinex/worker:latest alpinex/web:latest 2>/dev/null || true
   ```
```

---

## 💻 Manual Installation (For Contributors & Local Dev)

If you wish to contribute to ALPINEX or run directly from source:

```bash
# 1. Clone repository
git clone https://github.com/egichandrap/ALPINEX.git
cd ALPINEX

# 2. Setup configuration
cp .env.example .env

# 3. Build all binaries and web assets
make all

# 4. Run tests (TDD)
make test

# 5. Start with Docker Compose
docker compose up -d
```

---

## Key Features

- **Unified API Workspace:** Build, explore, and manage HTTP/REST requests in nested collections.
- **Dynamic Environments:** Manage variables and AES-256 encrypted secrets across Development, Staging, and Production.
- **Functional Test Runner:** Create multi-step chained suites with status, header, and JSONPath assertions.
- **Performance Engineering:** Visually configure Constant VUs, Ramping VUs, and Arrival Rate workloads without writing manual k6 scripts.
- **Live Real-Time Telemetry:** Monitor P50, P90, P95, and P99 latencies, RPS, and error rates via sub-second WebSockets.
- **Historical Comparison:** Directly compare regressions and latency shifts across different test runs.
- **Enterprise Ready:** Full multi-tenant RBAC, SSRF protection against internal network leakage, and append-only audit logging.
- **Automation First:** Headless CLI and versioned REST APIs ready for GitHub Actions, GitLab CI, and Jenkins.

---

## Architectural Principles

Designed strictly adhering to **Domain-Driven Design (DDD)** and **Clean Architecture**:

```text
Presentation / Delivery (HTTP / WS / CLI)
          │
          ▼
   Application / Use Cases
          │
          ▼
   Domain Core (Entities, Value Objects, Domain Events)
          ▲
          │
Infrastructure (PostgreSQL, Redis, k6 Subprocess Runner)
```

For complete architectural specifications, see [`docs/`](docs/):
- [`docs/01-prd-gap-analysis.md`](docs/01-prd-gap-analysis.md)
- [`docs/02-domain-driven-design.md`](docs/02-domain-driven-design.md)
- [`docs/03-c4-architecture-and-clean-architecture.md`](docs/03-c4-architecture-and-clean-architecture.md)
- [`docs/04-database-erd-and-migrations.md`](docs/04-database-erd-and-migrations.md)
- [`docs/05-api-specification.md`](docs/05-api-specification.md)
- [`docs/06-security-and-responsible-testing.md`](docs/06-security-and-responsible-testing.md)
- [`docs/07-jira-breakdown-and-roadmap.md`](docs/07-jira-breakdown-and-roadmap.md)

---

## Project Structure

```text
.
├── cmd/
│   ├── api/        # Control Plane API server entry point
│   ├── worker/     # Execution worker & k6 runner daemon
│   └── cli/        # Standalone command-line runner
├── internal/
│   ├── core/       # DDD Core: Domain entities, ports & application use cases
│   └── adapters/   # Clean Architecture adapters (Postgres, Redis, k6 runner, HTTP)
├── web/            # React + TypeScript Web application
├── deploy/         # Dockerfiles and deployment configurations
├── docs/           # Architecture, domain design, and API specs
├── scripts/        # 1-Line installer scripts
└── Makefile        # Development automation
```

---

## License

ALPINEX is open-source software licensed under the [Apache License, Version 2.0](LICENSE).
