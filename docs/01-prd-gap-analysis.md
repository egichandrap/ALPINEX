# ALPINEX — PRD Gap Analysis & Architectural Decisions

## 1. Executive Summary

This document performs an exhaustive gap analysis on **PRD-ALPINEX.md** (Version 1.0) according to Section 23 of the PRD (REA Delivery Workflow). It captures requirements ambiguity, architectural conflicts, open decisions, and technical trade-offs required prior to Phase 1 implementation.

---

## 2. Requirement Clarifications & Gaps Identified

### 2.1 Product Naming & Branding
- **PRD Reference:** Section 1.1, Section 21
- **Current State:** Document titles reference "API Testing Platform" and "ALPINEX" interchangeably.
- **Decision:** The canonical product name is established as **ALPINEX** (Open-Source API Testing & Performance Engineering Platform), with repository and package identifier `alpinex`.

### 2.2 Performance Engine Integration Architecture (k6)
- **PRD Reference:** Section 9.1, Section 10.1, FR-EXEC-001
- **Ambiguity:** Whether k6 is invoked as an embedded Go library, spawned as a local subprocess, or commanded through the k6 REST API / distributed worker.
- **Analysis:**
  - k6 as Go library: k6 is written in Go, but its internal packages are primarily designed for its own CLI and subject to upstream breakages.
  - k6 as standalone subprocess: Robust, isolated crash boundaries, easy version pinning (`k6 run --out json=... script.js`).
  - Distributed k6 workers: Managed via worker daemon communicating with the ALPINEX control plane via gRPC or Redis queue.
- **Architectural Resolution:**
  - **Local/MVP:** ALPINEX Worker executes k6 binary via controlled subprocess wrapper with stdin/stdout/stderr streaming and JSON/Prometheus metrics emitter.
  - **Core Domain:** Decoupled through `ExecutionEngine` port (`Run(ctx, spec)` returning an event stream). Neither the domain nor application layer imports k6 packages directly.

### 2.3 Percentile Metric Aggregation Math
- **PRD Reference:** FR-MON-004 ("Percentiles tidak boleh dihitung dengan merata-ratakan percentile worker")
- **Gap:** How multi-worker and multi-batch percentiles (P50, P90, P95, P99) are calculated accurately without retaining every raw HTTP sample in RAM/PostgreSQL.
- **Architectural Resolution:**
  - Implement **t-digest** or **HdrHistogram** / streaming quantiles in the Metrics Collector.
  - Store rollup bucket histograms in PostgreSQL for long-term retention and fast querying.
  - Real-time streaming via Redis Pub/Sub directly to WebSocket/SSE clients.

### 2.4 SSRF & Localhost Testing Guardrails
- **PRD Reference:** Section 11.2, 11.3 (Target Authorization & SSRF protection)
- **Conflict:** Developers testing locally via Docker Compose often need to test `http://host.docker.internal:...` or `http://localhost:...`, but enterprise production deployments must strictly forbid private IP egress and cloud metadata endpoints (`169.254.169.254`).
- **Architectural Resolution:**
  - Egress policy is strictly environment-configurable:
    - `SECURITY_ALLOW_PRIVATE_IPS=true` (Default in `development` mode with explicit visual warning banner).
    - `SECURITY_ALLOW_PRIVATE_IPS=false` (Enforced in `production` mode; RFC 1918, link-local, loopback, and metadata IPs blocked before dispatch).
  - DNS resolution check prior to socket connection to prevent DNS rebinding attacks.

### 2.5 Secret Storage & Variable Resolution Precedence
- **PRD Reference:** FR-ENV-002, FR-ENV-003
- **Resolution Order Defined:**
  `Runtime/Request Overrides > Environment Variables > Collection Variables > Project Variables > Workspace Variables > Organization Variables > Global Defaults`.
- **Secret Encryption:**
  Secrets are AES-256-GCM encrypted in PostgreSQL using an application master key (`APP_ENCRYPTION_KEY`). Secrets are never logged, never returned in ordinary API responses (masked as `********`), and masked in test execution reports.

### 2.6 Distributed Workers vs MVP Boundary
- **PRD Reference:** Section 17.2, Section 20 (Constraint 13: "Distributed testing bukan persyaratan MVP")
- **Resolution:**
  - MVP (Phases 1-5): Built-in single worker running in the same container or companion worker service sharing Redis.
  - Phase 6+: Clustered remote workers registering via mutual auth token and reporting metrics back over gRPC/Redis.

---

## 3. Product Trade-Offs Matrix

| Decision Area | Option A | Option B | Selected Architectural Approach | Justification |
|---|---|---|---|---|
| **Architecture Pattern** | Traditional Layered MVC | Domain-Driven Design + Clean Architecture | **DDD + Clean Architecture** | Mandatory per PRD Section 22. Ensures engine-agnostic core and testability. |
| **API Transport for Live Metrics** | WebSocket | Server-Sent Events (SSE) | **Dual (WebSocket primary, SSE fallback)** | WebSocket supports bi-directional control (e.g. Stop/Pause), SSE for read-only dashboards. |
| **Execution Queue** | RabbitMQ / Kafka | Redis Streams / PubSub | **Redis Streams** | Redis is already part of the core stack; minimizes deployment footprint for self-hosted MVP. |
| **Frontend Framework** | Next.js SSR | React + Vite SPA | **React + Vite SPA + TypeScript** | Better fit for self-hosted Docker desktop-first dashboard; clean separation from Go backend API. |
| **Database Migrations** | GORM AutoMigrate | Versioned SQL scripts (`golang-migrate`) | **`golang-migrate`** | Deterministic, auditable, safe rollback; complies with enterprise DB standards. |

---

## 4. Design Approval Gate Sign-Off Points

Prior to starting Phase 1 (Platform Foundation implementation), the following design decisions are baseline:
1. **Repository Layout:** Monorepo with `cmd/api`, `cmd/worker`, `cmd/cli`, `internal/` (domain, application, ports, adapters), and `web/` (React SPA).
2. **License:** Apache License 2.0.
3. **Execution Port:** Standardized Go `ExecutionEngine` interface supporting both `NativeHttpRunner` and `K6Runner`.
4. **Phased Delivery:** Phase 0 (Foundation & Design) → Phase 1 (IAM, Org, Workspace, Project, DB/Redis) → Phase 2 (API Workspace & Collections) → Phase 3 (Functional Testing) → Phase 4 (Performance Testing with k6) → Phase 5 (Monitoring & Reporting).
