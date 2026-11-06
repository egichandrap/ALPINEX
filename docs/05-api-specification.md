# ALPINEX — REST API & Streaming Specification

## 1. API Protocol & Standard Envelope

All REST endpoints follow standard JSON envelopes with request correlation ID tracking:

### Success Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "correlation_id": "req_01h9x3...",
    "timestamp": "2026-11-07T00:00:00Z"
  }
}
```

### Error Response Envelope
```json
{
  "success": false,
  "error": {
    "code": "EXECUTION_LIMIT_EXCEEDED",
    "message": "Configured VUs (5000) exceeds organization quota (1000).",
    "details": [
      {
        "field": "workload.vus",
        "issue": "must be less than or equal to 1000"
      }
    ]
  },
  "metadata": {
    "correlation_id": "req_01h9x3...",
    "timestamp": "2026-11-07T00:00:00Z"
  }
}
```

---

## 2. Baseline REST Endpoint Inventory

### 2.1 Identity & Access Management (`/api/v1/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register initial or new user |
| `POST` | `/api/v1/auth/login` | Email/password login; returns JWT access + refresh tokens |
| `POST` | `/api/v1/auth/refresh` | Exchange refresh token for new access token |
| `POST` | `/api/v1/auth/logout` | Revoke session and refresh token |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile and global roles |

### 2.2 Organizations, Workspaces & Projects
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/organizations` | List organizations user belongs to |
| `POST` | `/api/v1/organizations` | Create an organization |
| `GET` | `/api/v1/organizations/{orgId}/workspaces` | List workspaces within organization |
| `POST` | `/api/v1/organizations/{orgId}/workspaces` | Create workspace |
| `GET` | `/api/v1/workspaces/{wsId}/projects` | List projects in workspace |
| `POST` | `/api/v1/workspaces/{wsId}/projects` | Create a new project |
| `GET` | `/api/v1/projects/{projId}` | Get project overview & summary stats |

### 2.3 Environments & Variables
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/projects/{projId}/environments` | List environments (Dev, Staging, Prod) |
| `POST` | `/api/v1/projects/{projId}/environments` | Create new environment |
| `PUT` | `/api/v1/environments/{envId}/variables` | Batch upsert variables and secrets |
| `GET` | `/api/v1/environments/{envId}/variables` | List variables (secrets returned as `********`) |

### 2.4 API Collections & Requests
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/projects/{projId}/collections` | List collections in project |
| `POST` | `/api/v1/projects/{projId}/collections` | Create collection |
| `POST` | `/api/v1/collections/{colId}/folders` | Create folder (supports nesting) |
| `POST` | `/api/v1/collections/{colId}/requests` | Create API Request |
| `PUT` | `/api/v1/requests/{reqId}` | Update request specification |
| `POST` | `/api/v1/requests/{reqId}/execute` | Immediate single-shot request execution (exploration) |
| `POST` | `/api/v1/projects/{projId}/import/openapi` | Import OpenAPI 3.x spec file/JSON |
| `POST` | `/api/v1/projects/{projId}/import/postman` | Import Postman v2.1 collection |

### 2.5 Functional Testing
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/projects/{projId}/test-suites` | List functional test suites |
| `POST` | `/api/v1/projects/{projId}/test-suites` | Create functional test suite |
| `POST` | `/api/v1/test-suites/{suiteId}/cases` | Add test case to suite |
| `POST` | `/api/v1/test-suites/{suiteId}/run` | Dispatch suite execution |

### 2.6 Performance Testing
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/projects/{projId}/performance-tests` | List performance test configurations |
| `POST` | `/api/v1/projects/{projId}/performance-tests` | Create performance test |
| `PUT` | `/api/v1/performance-tests/{testId}` | Update workload/thresholds/script |
| `POST` | `/api/v1/performance-tests/{testId}/run` | Trigger load/stress/spike test execution |

### 2.7 Executions, Telemetry & Reports
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/executions/{execId}` | Get execution status and summary |
| `POST` | `/api/v1/executions/{execId}/stop` | Safe emergency stop / cancellation |
| `GET` | `/api/v1/executions/{execId}/metrics` | Fetch historical aggregated metric series |
| `GET` | `/api/v1/executions/{execId}/report` | Retrieve full frozen report & threshold verdict |
| `GET` | `/api/v1/executions/compare` | Compare 2+ execution reports (`?ids=id1,id2`) |
| `GET` | `/api/v1/executions/{execId}/export/{format}` | Export report as HTML, JSON, or CSV |

---

## 3. Real-Time Streaming Specification

### WebSocket Endpoint: `/ws/v1/executions/{execId}`
Used by the Frontend Live Monitoring Dashboard for sub-second metrics and real-time log tailing.

#### Client → Server Messages:
- `{"action": "subscribe", "streams": ["metrics", "logs"]}`
- `{"action": "stop"}`

#### Server → Client Metric Packet:
```json
{
  "type": "metric_sample",
  "data": {
    "timestamp": "2026-11-07T00:10:02Z",
    "vus": 120,
    "rps": 450.5,
    "latency": {
      "avg": 42.1,
      "p50": 38.0,
      "p90": 65.4,
      "p95": 92.1,
      "p99": 145.0
    },
    "error_rate": 0.002,
    "status_codes": {
      "200": 449,
      "500": 1
    }
  }
}
```
