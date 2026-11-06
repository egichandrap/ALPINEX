# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# Open-Source API Testing & Performance Engineering Platform

> **Ultimate Product Specification — Version 1.0**
>
> Status: Draft — Baseline for Product, Domain & Engineering Design  
> Product name: TBD  
> Working name: API Testing Platform  
> Primary deployment: Self-hosted using Docker  
> Primary performance engine: Grafana k6  
> Backend: Golang  
> Frontend: React + TypeScript  
> Database: PostgreSQL  
> Cache / coordination: Redis  
> Architecture: Domain-Driven Design (DDD) + Clean Architecture  
> Engineering standards: SOLID + Test-Driven Development (TDD)  
> Development workflow: REA, design-first

---

## Document Control

| Field | Value |
|---|---|
| Document | Product Requirements Document |
| Version | 1.0 |
| Status | Draft — Product Baseline |
| Product category | API Testing & Performance Engineering |
| Product name | TBD |
| Target users | Individual, Developer Teams, QA, Performance Engineering, Enterprise |
| Deployment | Self-hosted, Local, Server |
| Distribution | Open-source |
| Primary execution engine | Grafana k6 |
| Backend | Golang |
| Frontend | React + TypeScript |
| Primary database | PostgreSQL |
| Cache and coordination | Redis |
| Containerization | Docker |
| Design methodology | DDD + Clean Architecture |
| Development methodology | Agile + TDD |

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision, Mission & Positioning](#2-product-vision-mission--positioning)
3. [Business Objectives & Success Metrics](#3-business-objectives--success-metrics)
4. [Target Users & Personas](#4-target-users--personas)
5. [Product Scope](#5-product-scope)
6. [Product Modules & Functional Requirements](#6-product-modules--functional-requirements)
7. [User Experience & Navigation](#7-user-experience--navigation)
8. [Main User Workflows](#8-main-user-workflows)
9. [Execution Engine & Protocol Strategy](#9-execution-engine--protocol-strategy)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [Security & Responsible Load Testing](#11-security--responsible-load-testing)
12. [Deployment Architecture & Operations](#12-deployment-architecture--operations)
13. [Data Management Requirements](#13-data-management-requirements)
14. [API Design Requirements](#14-api-design-requirements)
15. [Licensing & Open-Source Strategy](#15-licensing--open-source-strategy)
16. [Product Roadmap](#16-product-roadmap)
17. [MVP Definition & Release Criteria](#17-mvp-definition--release-criteria)
18. [Testing & Quality Strategy](#18-testing--quality-strategy)
19. [Risks & Mitigation](#19-risks--mitigation)
20. [Constraints & Assumptions](#20-constraints--assumptions)
21. [Definition of Done](#21-definition-of-done)
22. [Mandatory Engineering Standards](#22-mandatory-engineering-standards)
23. [REA Delivery Workflow](#23-rea-delivery-workflow)
24. [Final Product Acceptance Vision](#24-final-product-acceptance-vision)
25. [Glossary](#25-glossary)

---

# 1. Executive Summary

## 1.1 Product Overview

API Testing Platform adalah platform open-source untuk API development, functional testing, performance testing, load testing, stress testing, test automation, monitoring, dan reporting dalam satu aplikasi.

Platform dirancang sebagai alternatif open-source terhadap solusi komersial seperti ReadyAPI, dengan pengalaman API workspace yang terinspirasi dari Postman serta kemampuan performance testing dari Grafana k6 dan konsep scenario-based testing dari Apache JMeter.

Pengguna dapat membuat API request, mengelola collection, menyusun test case, membangun scenario, menentukan workload, menjalankan pengujian, memonitor hasil secara real-time, menganalisis performa, dan menghasilkan laporan.

Platform memiliki domain testing dan lifecycle execution sendiri. Execution engine merupakan komponen yang dapat diganti atau diperluas melalui adapter dan plugin tanpa mengikat domain core pada teknologi tertentu.

## 1.2 Product Problem

Pengujian API sering kali membutuhkan beberapa tools terpisah:

- API exploration dan request management.
- Functional testing dan assertion.
- Load dan stress testing.
- Execution orchestration.
- Monitoring dan metrics.
- Reporting dan historical comparison.
- CI/CD automation.

Pemisahan tersebut dapat menyebabkan konfigurasi berulang, duplikasi test scenario, hasil yang tersebar, serta kesulitan menghubungkan functional behavior dengan performance behavior.

Platform ini bertujuan menyatukan lifecycle tersebut tanpa mengharuskan pengguna berpindah-pindah aplikasi.

## 1.3 Product Value Proposition

1. Unified API workspace dan testing lifecycle.
2. Visual test designer yang mengurangi kebutuhan menulis script manual.
3. Performance testing dengan k6 sebagai engine utama.
4. Reusable request dan scenario antara functional dan performance testing.
5. Real-time monitoring dan historical comparison.
6. Self-hosted deployment dengan kontrol atas data dan infrastruktur.
7. Extensible execution engine dan protocol adapters.
8. CLI, REST API, dan CI/CD automation.
9. Enterprise-oriented access control, audit, dan governance.
10. AI-assisted test generation dan performance analysis sebagai kemampuan lanjutan.

---

# 2. Product Vision, Mission & Positioning

## 2.1 Product Vision

Menjadi open-source API Testing & Performance Engineering Platform yang memungkinkan developer, QA engineer, performance engineer, dan enterprise melakukan seluruh siklus pengujian API melalui satu platform yang fleksibel, extensible, observable, dan dapat dioperasikan secara mandiri.

## 2.2 Product Mission

- Menyatukan API functional testing dan performance testing.
- Mengurangi ketergantungan pada tools yang terpisah.
- Menyediakan visual test designer yang mudah digunakan.
- Menyediakan execution engine yang dapat dikembangkan melalui plugin.
- Mempermudah performance analysis dan bottleneck investigation.
- Mendukung automation melalui CLI, REST API, dan CI/CD.
- Memberikan kontrol penuh melalui self-hosted deployment.
- Menyediakan governance dan security yang layak untuk penggunaan enterprise.

## 2.3 Product Positioning

Produk bukan sekadar graphical interface untuk k6.

Produk merupakan platform dengan domain dan lifecycle testing sendiri.

Tanggung jawab utama:

| Layer | Responsibility |
|---|---|
| Product Core | Workspace, project, collection, test definition, scenario, execution lifecycle |
| Functional Runner | Functional request execution, chaining, assertion |
| Performance Engine | Load generation dan performance execution |
| Orchestration | Scheduling, queue, worker assignment, lifecycle coordination |
| Monitoring | Metrics collection, aggregation, streaming |
| Reporting | Result analysis, comparison, report generation |
| Integration | CLI, REST API, CI/CD, plugins, external metrics |

---

# 3. Business Objectives & Success Metrics

## 3.1 Business Objectives

| ID | Objective | Expected Outcome |
|---|---|---|
| BO-001 | Open-source availability | Produk dapat digunakan dan dikembangkan komunitas |
| BO-002 | Self-hosted deployment | Pengguna mengontrol deployment dan data |
| BO-003 | Unified testing | Functional dan performance testing tersedia dalam satu platform |
| BO-004 | Extensibility | Engine dan protokol dapat ditambahkan |
| BO-005 | Enterprise readiness | Organization, RBAC, audit, dan governance |
| BO-006 | Automation | CLI, REST API, dan CI/CD |
| BO-007 | Developer productivity | Mengurangi kompleksitas proses pengujian API |

## 3.2 Product Success Metrics

Target berikut merupakan sasaran produk awal, bukan jaminan performa di semua environment. Nilai final harus divalidasi melalui benchmark yang terdokumentasi.

| Metric | Initial Target |
|---|---|
| MVP functional completeness | Seluruh fitur inti MVP tersedia |
| Functional execution | Sequential dan chained requests |
| Performance execution | Load, stress, spike, dan soak |
| Real-time metrics | Interval default 1–2 detik, dapat dikonfigurasi |
| Execution traceability | Setiap execution memiliki ID unik |
| Result durability | Hasil yang telah dipersistenkan dapat dipulihkan setelah restart |
| Docker deployment | Dapat dijalankan melalui Docker Compose |
| OpenAPI import | OpenAPI 3.x sesuai compatibility matrix |
| Collection import | Format Postman yang didukung dan terdokumentasi |
| CI/CD | CLI dan REST API dapat digunakan dalam pipeline |
| Test comparison | Membandingkan minimal dua execution |
| Security | RBAC, audit, secret protection, execution safeguards |

## 3.3 North Star Metric

**Successful Test Runs Analyzed**

Jumlah execution yang selesai dan menghasilkan data yang dapat dianalisis pengguna.

Metric ini mengukur penggunaan inti platform, bukan hanya jumlah akun atau request.

---

# 4. Target Users & Personas

## 4.1 Individual Developer

**Needs**
- Menguji REST API.
- Membuat request secara manual.
- Menyimpan collection.
- Membuat assertion.
- Menjalankan load test sederhana.
- Melihat response time dan error rate.

**Pain points**
- Harus berpindah antara API client dan performance tool.
- Membutuhkan pemahaman scripting untuk load test.
- Sulit membandingkan hasil pengujian.

## 4.2 QA Engineer

**Needs**
- Membuat functional test.
- Menyusun test suite.
- Menggunakan environment berbeda.
- Menjalankan regression test.
- Membuat data-driven test.
- Menghasilkan test report.

**Pain points**
- Test case tidak terpusat.
- Pengujian berulang masih manual.
- Sulit melakukan reuse test case.

## 4.3 Performance Engineer

**Needs**
- Menentukan workload.
- Mengatur virtual users dan arrival rate.
- Menjalankan load, stress, spike, dan soak testing.
- Melihat throughput dan latency.
- Mengidentifikasi bottleneck.
- Membandingkan performa antar-release.

**Pain points**
- Script kompleks.
- Distributed testing sulit dikelola.
- Sulit menghubungkan test result dengan resource utilization.

## 4.4 DevOps Engineer

**Needs**
- Menjalankan testing melalui pipeline.
- Menggunakan CLI.
- Mengatur execution worker.
- Mengelola resource.
- Menghubungkan metrics dengan monitoring system.

**Pain points**
- Performance test sulit distandardisasi.
- Hasil tidak terintegrasi dengan pipeline.
- Execution terpusat sulit dikelola.

## 4.5 Enterprise Administrator

**Needs**
- Mengelola organization dan workspace.
- Mengatur akses.
- Mengelola environment dan secret.
- Memantau aktivitas pengguna.
- Menetapkan governance.
- Mengelola execution quota.

**Pain points**
- Testing governance tidak terpusat.
- Credential berisiko terekspos.
- Audit trail tidak lengkap.

---

# 5. Product Scope

## 5.1 In Scope

1. Authentication dan authorization.
2. Organization dan workspace management.
3. Project management.
4. API request builder.
5. Collection management.
6. Environment management.
7. Authentication management.
8. Functional testing.
9. Test case dan test suite management.
10. Assertion engine.
11. Data-driven testing.
12. Performance testing.
13. Workload profile management.
14. k6 integration.
15. Execution orchestration.
16. Worker management.
17. Real-time monitoring.
18. Result storage.
19. Reporting dan analytics.
20. Test history.
21. Test comparison.
22. CLI.
23. REST API.
24. CI/CD integration.
25. Docker deployment.
26. Plugin architecture.
27. Security dan audit.
28. AI-assisted testing sebagai pengembangan lanjutan.

## 5.2 Out of Scope for Initial MVP

- Full API mocking platform.
- Full API gateway.
- Production APM replacement.
- Full distributed tracing platform.
- Automatic infrastructure provisioning.
- Managed cloud load testing service.
- Arbitrary execution of user-supplied binaries.
- Database administration platform.
- Automatic production deployment.
- Unrestricted public-target load testing.

Fitur di luar MVP dapat dimasukkan ke roadmap setelah core platform stabil.

---

# 6. Product Modules & Functional Requirements

Setiap requirement memiliki ID stabil untuk traceability ke domain design, Jira, implementation, dan acceptance testing.

## MODULE A — Identity & Access Management

### A.1 Authentication

**ID: FR-IAM-001**

Platform harus menyediakan autentikasi pengguna.

Functional requirements:

- Register user.
- Login.
- Logout.
- Refresh token.
- Password hashing.
- Change password.
- Forgot password.
- Reset password.
- Session management.
- Account activation.
- Account deactivation.

Authentication methods:

- Email and password.
- OAuth2/OIDC sebagai extension.
- Enterprise SSO sebagai pengembangan lanjutan.

Acceptance criteria:

- Protected resources tidak dapat diakses tanpa autentikasi.
- Access token memiliki expiry.
- Refresh token dapat direvoke.
- Password tidak disimpan dalam bentuk plaintext.
- Authentication failure tidak membocorkan informasi sensitif.

### A.2 Role-Based Access Control

**ID: FR-IAM-002**

Role minimum:

| Role | Permissions |
|---|---|
| Super Admin | Mengelola seluruh platform |
| Organization Owner | Mengelola organization |
| Organization Admin | Mengelola anggota dan konfigurasi |
| Workspace Admin | Mengelola workspace |
| Project Admin | Mengelola project |
| Developer | Membuat dan mengelola API |
| Tester | Membuat dan menjalankan test |
| Viewer | Melihat data dan report |

Permissions berbasis resource dan action.

Contoh:

- `project.read`
- `project.create`
- `project.update`
- `collection.manage`
- `testcase.execute`
- `performance.execute`
- `result.read`
- `environment.manage`
- `secret.manage`
- `organization.manage`

Authorization wajib divalidasi di backend. Penyembunyian menu frontend bukan mekanisme authorization.

## MODULE B — Organization, Workspace & Project Management

### B.1 Organization

**ID: FR-ORG-001**

- Create, update, archive, dan delete sesuai policy.
- Manage members.
- Assign roles.
- Organization settings.
- Organization audit log.

### B.2 Workspace

**ID: FR-WS-001**

Workspace merupakan ruang kerja untuk mengelompokkan project.

- Create workspace.
- Update workspace.
- Archive workspace.
- Manage workspace members.
- Workspace-level permissions.
- Workspace variables.

### B.3 Project

**ID: FR-PROJ-001**

- Create project.
- Edit project.
- Archive project.
- Delete project sesuai policy.
- Project description.
- Project settings.
- Project members.
- Project activity history.

Project menjadi ruang organisasi untuk collection, test case, scenario, environment, dan execution.

## MODULE C — API Workspace & Request Builder

### C.1 API Request Builder

**ID: FR-API-001**

Platform menyediakan interface visual untuk membangun API request.

Supported HTTP methods:

- GET
- POST
- PUT
- PATCH
- DELETE
- HEAD
- OPTIONS
- Custom methods jika didukung transport adapter.

Request configuration:

- URL.
- Path parameters.
- Query parameters.
- Headers.
- Cookies.
- Request body.
- Authentication.
- Timeout.
- Redirect policy.
- TLS configuration.
- Proxy configuration.

Request body types:

- None.
- JSON.
- XML.
- Text.
- Form URL encoded.
- Multipart form-data.
- Binary/file upload.

### C.2 Response Viewer

**ID: FR-API-002**

Menampilkan:

- HTTP status.
- Response headers.
- Response body.
- Response time.
- Response size.
- Protocol information jika tersedia.
- Error details.
- JSON/XML formatting.

Response viewer mendukung raw dan formatted display.

### C.3 Collection Management

**ID: FR-API-003**

- Create collection.
- Rename collection.
- Folder management.
- Nested folders.
- Add request.
- Duplicate request.
- Move request.
- Reorder request.
- Import/export.
- Collection variables.
- Collection documentation.

### C.4 Import & Export

**ID: FR-API-004**

Import targets:

- OpenAPI 3.x.
- Postman Collection format yang ditentukan.
- Native platform format.
- cURL import.

Export targets:

- Native collection.
- OpenAPI jika struktur dapat direpresentasikan.
- cURL.

Import harus melakukan validation dan menampilkan error/warning sebelum data disimpan.

### C.5 Request History

**ID: FR-API-005**

- Menyimpan request history.
- Menampilkan response.
- Re-run request.
- Filter berdasarkan project, user, method, dan waktu.
- Menghapus history berdasarkan policy.

Secret tidak boleh tersimpan sebagai plaintext di history.

## MODULE D — Environment & Variable Management

### D.1 Environment

**ID: FR-ENV-001**

User dapat membuat environment seperti Local, Development, QA, Staging, Production, dan Custom.

Setiap environment memiliki variables.

Contoh:

```yaml
base_url: https://api-dev.example.com
client_id: sample-client
timeout: 30000
```

### D.2 Variable Resolution

**ID: FR-ENV-002**

Variable scopes:

1. Global.
2. Organization.
3. Workspace.
4. Project.
5. Collection.
6. Environment.
7. Runtime/request.

Sistem harus memiliki aturan precedence deterministik. Scope paling spesifik mengalahkan scope yang lebih umum.

Syntax:

```text
{{base_url}}
{{access_token}}
{{customer_id}}
```

Variable resolution harus mendukung validation untuk variable yang belum terdefinisi dan mencegah secret leakage.

### D.3 Secret Management

**ID: FR-ENV-003**

- Secret masking.
- Encryption at rest.
- Secure retrieval.
- Secret rotation.
- Access control.
- Audit access.
- Prevent accidental exposure in logs and reports.

Secret harus dipisahkan dari ordinary variables.

## MODULE E — Authentication & Protocol Support

### E.1 Authentication Types

**ID: FR-AUTH-001**

Minimum:

- No Auth.
- Basic Auth.
- Bearer Token.
- API Key.
- OAuth 2.0.
- JWT configuration.
- Custom headers.
- Mutual TLS jika didukung transport adapter.

### E.2 Protocol Strategy

**ID: FR-PROTO-001**

Platform menggunakan protocol adapter architecture.

| Protocol | Target Phase | Approach |
|---|---|---|
| HTTP/1.1 | MVP | Native HTTP adapter |
| HTTP/2 | MVP | HTTP adapter / k6 |
| REST | MVP | HTTP adapter |
| WebSocket | Early expansion | k6 / dedicated adapter |
| GraphQL | Early expansion | HTTP adapter |
| SOAP | Expansion | XML/SOAP adapter |
| gRPC | Expansion | Dedicated adapter / k6 |
| Kafka | Future | Plugin |
| RabbitMQ / AMQP | Future | Plugin |
| MQTT | Future | Plugin |
| Redis Protocol | Future | Plugin |
| Database protocols | Future | Dedicated adapters |

Protocol support harus dibedakan menjadi:

- API exploration support.
- Functional execution support.
- Performance execution support.

Dukungan satu protokol pada satu mode tidak otomatis berarti protokol tersebut didukung pada semua mode.

## MODULE F — Functional Testing

### F.1 Test Case Management

**ID: FR-FUNC-001**

User dapat membuat test case dari request yang tersedia.

Test case memiliki:

- Name.
- Description.
- Request reference.
- Preconditions.
- Steps.
- Assertions.
- Variables.
- Expected result.
- Tags.
- Execution configuration.

### F.2 Assertion Engine

**ID: FR-FUNC-002**

Supported assertions:

- HTTP status equals.
- HTTP status range.
- Response time less than.
- Header exists.
- Header equals.
- JSONPath exists.
- JSONPath equals.
- JSONPath contains.
- JSON schema validation.
- XML XPath validation.
- Body contains.
- Body equals.
- Regex match.
- Custom expression.

Contoh:

```text
ASSERT status == 200
ASSERT response_time < 500ms
ASSERT $.data.id EXISTS
ASSERT $.data.status == "SUCCESS"
```

Assertion menghasilkan structured result:

- Passed.
- Failed.
- Skipped.
- Error.

### F.3 Test Suite

**ID: FR-FUNC-003**

- Create test suite.
- Add test cases.
- Reorder test cases.
- Sequential execution.
- Conditional execution.
- Setup steps.
- Teardown steps.
- Stop on failure.
- Continue on failure.
- Suite-level variables.

### F.4 Test Chaining

**ID: FR-FUNC-004**

Mendukung alur:

`Login → Get Profile → Create Transaction → Get Transaction → Validate Transaction`

Response dari satu request dapat digunakan sebagai input request berikutnya.

Contoh:

```text
access_token = response.data.token
customer_id = response.data.customer_id
```

Platform harus mengatur dependency antar-step dan menampilkan error ketika variable tidak ditemukan.

### F.5 Data-Driven Testing

**ID: FR-FUNC-005**

Supported data sources:

- Inline JSON.
- CSV.
- JSON file.
- Runtime generated data.
- Future external data source adapter.

Execution modes:

- One iteration per row.
- Repeated dataset.
- Randomized dataset jika dikonfigurasi.

### F.6 Scripting

**ID: FR-FUNC-006**

Platform dapat menyediakan scripting extension untuk pre-request dan post-response.

Persyaratan:

- Sandboxed execution.
- Execution timeout.
- Memory limits.
- No unrestricted host filesystem access.
- No unrestricted network access.
- Explicit permission for external network access.

Scripting engine harus dipisahkan dari domain core.

## MODULE G — Performance Testing

### G.1 Performance Test Designer

**ID: FR-PERF-001**

User dapat membuat performance test tanpa menulis script secara manual.

Test configuration:

- Test name.
- Target request atau scenario.
- Environment.
- Protocol.
- Execution engine.
- Workload profile.
- Duration.
- Virtual users.
- Arrival rate.
- Ramp-up.
- Ramp-down.
- Think time.
- Pacing.
- Threshold.
- Data source.
- Execution timeout.

Mode pembuatan:

1. Visual Designer.
2. Script Editor.
3. Import Script.
4. AI-assisted generation pada roadmap lanjutan.

### G.2 Performance Test Types

**ID: FR-PERF-002**

| Test Type | Objective |
|---|---|
| Smoke Test | Memastikan sistem dapat menangani beban minimum |
| Load Test | Menguji performa pada beban yang diperkirakan |
| Stress Test | Menentukan batas kapasitas sistem |
| Spike Test | Menguji perubahan beban secara tiba-tiba |
| Soak / Endurance Test | Menguji stabilitas dalam durasi panjang |
| Breakpoint Test | Mencari titik penurunan performa |
| Scalability Test | Mengevaluasi kemampuan scaling |
| Capacity Test | Mengukur kapasitas maksimum berdasarkan kriteria |

Test type merupakan template workload, bukan sekadar label.

### G.3 Workload Model

**ID: FR-PERF-003**

Platform harus membedakan Virtual Users, Iterations, Requests per second, Transactions per second, dan Arrival rate. Nilai-nilai tersebut tidak boleh dianggap identik.

**Virtual User Model**

```yaml
type: constant-vus
vus: 100
duration: 5m
```

**Ramping Virtual Users**

```yaml
stages:
  - duration: 2m
    target: 100
  - duration: 5m
    target: 500
  - duration: 2m
    target: 0
```

**Arrival Rate**

```yaml
type: constant-arrival-rate
rate: 100
time_unit: 1s
duration: 5m
pre_allocated_vus: 100
max_vus: 500
```

Platform harus menjelaskan perbedaan model closed workload dan open workload, serta dampaknya terhadap interpretasi hasil.

### G.4 Scenario Builder

**ID: FR-PERF-004**

User dapat menyusun multi-step scenario.

Contoh:

```text
Scenario: Customer Transaction

1. Login
2. Get Customer Profile
3. Check Balance
4. Create Transaction
5. Get Transaction Status
6. Validate Result
```

Scenario mendukung:

- Sequential steps.
- Conditional steps.
- Extract variable.
- Request chaining.
- Assertions.
- Think time.
- Weighted scenario.
- Data-driven execution.
- Error handling.

### G.5 Threshold Configuration

**ID: FR-PERF-005**

Threshold dapat ditentukan berdasarkan:

- Average response time.
- P90 latency.
- P95 latency.
- P99 latency.
- Request failure rate.
- Throughput.
- Custom engine metrics.

Contoh:

```yaml
thresholds:
  http_req_failed:
    - "rate<0.01"
  http_req_duration:
    - "p(95)<500"
    - "p(99)<1000"
```

Threshold menghasilkan status:

- Passed.
- Failed.
- Inconclusive.

Execution yang selesai tidak otomatis dinyatakan PASS. Status harus mempertimbangkan threshold, kelengkapan metrics, dan kondisi execution.

### G.6 Script Editor

**ID: FR-PERF-006**

Mendukung JavaScript/k6 script.

Fitur:

- Syntax highlighting.
- Code editor.
- Script validation.
- Script import.
- Script export.
- Script versioning.
- Script preview.
- Script execution.
- Script diff.

Contoh:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '5m',
};

export default function () {
  const response = http.get(
    'https://api.example.com/health'
  );

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response under 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

Platform harus menyimpan source script sebagai artifact yang dapat dilacak terhadap execution.

### G.7 Functional-to-Performance Reuse

**ID: FR-PERF-007**

Platform harus mendukung penggunaan kembali test definition dari functional testing sebagai dasar performance scenario.

Ketentuan:

- Reuse request definition.
- Reuse authentication configuration.
- Reuse variable references.
- Reuse assertions yang kompatibel.
- Performance-specific configuration terpisah.
- Execution adapter dapat melakukan translation ke engine-specific script.

Tidak semua functional script otomatis kompatibel dengan performance runner. Incompatibility harus ditampilkan secara eksplisit dan tidak boleh diam-diam mengubah perilaku test.

## MODULE H — Execution Engine & Orchestration

### H.1 Engine Abstraction

**ID: FR-EXEC-001**

Platform menyediakan abstraction layer untuk execution engine.

Kontrak konseptual:

```go
type ExecutionEngine interface {
    Name() string
    Capabilities() EngineCapabilities
    Validate(input ExecutionInput) error
    Execute(input ExecutionInput) (ExecutionHandle, error)
    Stop(handle ExecutionHandle) error
    CollectMetrics(handle ExecutionHandle) error
}
```

Interface final ditentukan melalui Domain Design dan Application Design. Lifecycle execution, cancellation, event streaming, dan error semantics harus didefinisikan secara konsisten.

Engine utama:

- k6 Performance Engine.
- Native HTTP Functional Runner.

Future engines:

- JMeter.
- Other compatible execution engines.
- Protocol-specific adapters.

### H.2 Execution Lifecycle

**ID: FR-EXEC-002**

Lifecycle konseptual:

```text
DRAFT
  |
VALIDATING
  |
QUEUED
  |
PROVISIONING
  |
RUNNING
  |
COMPLETED
```

Alternative terminal states:

- FAILED.
- CANCELLED.
- TIMEOUT.
- ABORTED.

State transition harus tervalidasi dan tidak boleh terjadi secara sembarang. State yang sudah terminal tidak boleh kembali ke RUNNING tanpa membuat execution baru.

### H.3 Worker Management

**ID: FR-EXEC-003**

- Register worker.
- Worker heartbeat.
- Worker status.
- Worker capacity.
- Worker health.
- Worker labels.
- Worker assignment.
- Worker draining.
- Worker shutdown.
- Worker version tracking.

Worker status:

- Online.
- Offline.
- Busy.
- Draining.
- Unhealthy.

### H.4 Distributed Execution

**ID: FR-EXEC-004**

Platform harus mendukung distribusi workload.

Contoh:

```text
Test Run: RUN-001
Configured Workload: 4,000 VUs

Worker A: 1,000 VUs
Worker B: 1,000 VUs
Worker C: 1,000 VUs
Worker D: 1,000 VUs
```

Persyaratan:

- Workload partitioning.
- Worker coordination.
- Metrics aggregation.
- Failure handling.
- Worker health monitoring.
- Execution cancellation.
- Result correlation.

Jumlah VU yang dikonfigurasi tidak boleh dianggap sebagai jumlah VU aktual sebelum worker siap dan workload benar-benar berjalan.

### H.5 Resource Governance

**ID: FR-EXEC-005**

Administrator dapat mengatur:

- Maximum concurrent test runs.
- Maximum VUs per execution.
- Maximum duration.
- Worker capacity.
- Maximum CPU allocation.
- Maximum memory allocation.
- Queue priority.
- Per-user quota.
- Per-organization quota.

Platform harus menampilkan peringatan ketika load generator mendekati kapasitasnya.

## MODULE I — Real-Time Monitoring & Metrics

### I.1 Real-Time Dashboard

**ID: FR-MON-001**

Dashboard menampilkan:

- Current VUs.
- Active workers.
- Total requests.
- Requests per second.
- Iterations per second.
- Average response time.
- Minimum response time.
- Maximum response time.
- P50.
- P90.
- P95.
- P99.
- Error rate.
- HTTP status distribution.
- Data received.
- Data sent.

### I.2 Resource Monitoring

**ID: FR-MON-002**

Generator metrics:

- CPU utilization.
- Memory utilization.
- Network throughput.
- Worker utilization.
- Process health.
- Worker execution errors.

Target application monitoring merupakan integrasi tambahan dan tidak otomatis tersedia hanya dari k6.

Integrasi dapat menggunakan:

- Prometheus.
- Grafana.
- OpenTelemetry-compatible sources.
- Other metrics adapters.

### I.3 Live Execution Controls

**ID: FR-MON-003**

User dengan permission dapat:

- Pause jika engine mendukung.
- Resume jika engine mendukung.
- Stop.
- Cancel.
- View logs.
- View metrics.
- View worker status.

Jika engine tidak mendukung pause/resume, UI harus menjelaskan keterbatasannya.

### I.4 Metrics Aggregation

**ID: FR-MON-004**

Platform harus menggabungkan metrics dari beberapa worker dengan benar.

Ketentuan:

- Counter dijumlahkan.
- Rates dihitung menggunakan interval dan denominator yang sesuai.
- Percentiles tidak boleh dihitung dengan merata-ratakan percentile worker.
- Histogram atau raw samples harus digunakan untuk agregasi percentile yang valid.
- Missing data harus ditandai.
- Clock skew dan timestamp alignment harus dipertimbangkan.
- Metric definitions dan units harus konsisten.

## MODULE J — Test Result & Reporting

### J.1 Execution History

**ID: FR-REPORT-001**

Setiap execution memiliki:

- Execution ID.
- Test definition version.
- Environment.
- Engine version.
- Execution start time.
- Execution end time.
- User.
- Worker information.
- Workload configuration.
- Status.
- Summary metrics.
- Artifact references.

### J.2 Result Dashboard

**ID: FR-REPORT-002**

Report menyediakan:

1. Executive summary.
2. Test configuration.
3. Performance overview.
4. Latency distribution.
5. Throughput chart.
6. Error analysis.
7. HTTP status distribution.
8. Worker performance.
9. Threshold evaluation.
10. Bottleneck indicators.
11. Execution logs.
12. Comparison with previous runs.

### J.3 Test Comparison

**ID: FR-REPORT-003**

User dapat membandingkan minimal dua execution.

Perbandingan:

- Average latency.
- P95.
- P99.
- Throughput.
- Error rate.
- Total requests.
- Duration.
- Workload.
- Resource utilization jika tersedia.

Sistem harus menampilkan apakah konfigurasi kedua test sebanding. Perbandingan dengan workload, environment, atau engine version yang berbeda harus diberi konteks.

### J.4 Report Export

**ID: FR-REPORT-004**

Supported export:

- HTML.
- PDF.
- CSV.
- JSON.

Report harus mempertahankan identitas execution, waktu pembuatan, konfigurasi, dan provenance metrics.

### J.5 Retention Policy

**ID: FR-REPORT-005**

Administrator dapat mengatur:

- Execution history retention.
- Raw metrics retention.
- Artifact retention.
- Log retention.
- Report retention.

Penghapusan harus mengikuti authorization dan audit policy.

## MODULE K — Automation & CI/CD

### K.1 CLI

**ID: FR-AUTO-001**

CLI menyediakan command konseptual:

```bash
apitest auth login

apitest collection list

apitest test run \
  --project project-id \
  --suite regression-suite

apitest performance run \
  --scenario checkout \
  --environment staging

apitest execution status \
  --id execution-id

apitest execution stop \
  --id execution-id

apitest report export \
  --id execution-id \
  --format html
```

CLI harus mendukung machine-readable output, non-interactive authentication, dan exit code yang konsisten.

### K.2 REST API

**ID: FR-AUTO-002**

Baseline endpoint:

```text
POST   /api/v1/auth/login
GET    /api/v1/organizations
POST   /api/v1/workspaces
POST   /api/v1/projects
GET    /api/v1/collections
POST   /api/v1/collections
POST   /api/v1/test-cases
POST   /api/v1/test-suites
POST   /api/v1/performance-tests
POST   /api/v1/executions
GET    /api/v1/executions/{id}
POST   /api/v1/executions/{id}/stop
GET    /api/v1/executions/{id}/metrics
GET    /api/v1/executions/{id}/report
```

Daftar ini merupakan baseline kebutuhan, bukan final OpenAPI contract.

### K.3 CI/CD Integration

**ID: FR-AUTO-003**

Target integrations:

- GitLab CI.
- GitHub Actions.
- Jenkins.
- Generic CI/CD runner.

Pipeline harus dapat:

1. Authenticate.
2. Trigger test.
3. Wait atau poll execution.
4. Retrieve execution status.
5. Evaluate threshold.
6. Return exit code.
7. Download report.

Exit code minimum:

| Code | Meaning |
|---|---|
| 0 | Execution selesai dan threshold passed |
| 1 | Test gagal atau threshold failed |
| 2 | Configuration/validation error |
| 3 | Execution infrastructure error |

Final mapping harus konsisten antara CLI dan API.

## MODULE L — Plugin Architecture

### L.1 Plugin Management

**ID: FR-PLUGIN-001**

Platform mendukung extension melalui plugin/adapter architecture.

Plugin categories:

- Protocol adapters.
- Execution engines.
- Authentication providers.
- Metrics exporters.
- Data sources.
- Report exporters.
- Notification providers.

### L.2 Plugin Lifecycle

- Plugin registration.
- Capability discovery.
- Version compatibility.
- Enable/disable.
- Configuration.
- Health status.
- Upgrade.
- Removal.

### L.3 Plugin Security

Plugin tidak boleh mendapatkan akses penuh terhadap host secara default.

Harus tersedia:

- Permission declaration.
- Resource isolation.
- Version validation.
- Trusted plugin registry atau explicit allowlist.
- Audit trail.
- Execution restrictions.

Plugin API dan compatibility contract harus terdokumentasi.

## MODULE M — AI Testing Assistant

AI merupakan fitur pembeda, tetapi bukan dependency wajib untuk fungsi utama platform.

### M.1 AI Test Generator

**ID: FR-AI-001**

Input:

- OpenAPI specification.
- Existing collections.
- Natural language instructions.
- Example request/response.

Output:

- Suggested test cases.
- Assertions.
- Test scenarios.
- Test data templates.
- Performance test script draft.

Semua hasil AI harus berupa draft untuk direview sebelum execution.

### M.2 AI Performance Analyst

**ID: FR-AI-002**

AI membantu menganalisis:

- Peningkatan latency.
- Error spike.
- Throughput degradation.
- Worker saturation.
- Potential bottleneck.
- Performance regression.

AI tidak boleh menyimpulkan root cause secara pasti hanya berdasarkan metrics korelatif.

### M.3 AI Optimization Assistant

**ID: FR-AI-003**

Rekomendasi:

- Workload adjustment.
- Threshold suggestion.
- Test scenario improvements.
- Script optimization.
- Monitoring suggestions.

Rekomendasi harus menyertakan evidence dan tingkat keyakinan.

### M.4 AI Governance

- User approval sebelum execution.
- Tidak mengirim secret ke model AI secara default.
- Masking sensitive data.
- Configurable AI provider.
- Audit AI-generated artifacts.
- AI tidak boleh mengubah production system.

## MODULE N — Administration & Platform Settings

### N.1 Platform Settings

- General settings.
- Authentication settings.
- SMTP configuration.
- Storage configuration.
- Worker settings.
- Execution defaults.
- Resource limits.
- Retention policies.
- Audit configuration.
- Plugin configuration.

### N.2 Audit Log

**ID: FR-ADMIN-001**

Audit events:

- Login/logout.
- User management.
- Role changes.
- Project changes.
- Secret access.
- Environment updates.
- Test execution.
- Test cancellation.
- Plugin installation.
- Configuration changes.
- Data deletion.

Audit log tidak boleh dapat dimodifikasi oleh ordinary users.

---

# 7. User Experience & Navigation

## 7.1 Application Layout

Platform menggunakan dashboard layout dengan navigasi utama di sidebar.

```text
APPLICATION
│
├── Dashboard
│
├── Workspaces
│   └── Workspace
│       └── Projects
│           ├── API Collections
│           ├── Environments
│           ├── Functional Tests
│           │   ├── Test Cases
│           │   └── Test Suites
│           ├── Performance Tests
│           │   ├── Scenarios
│           │   ├── Workload Profiles
│           │   └── Scripts
│           ├── Executions
│           ├── Reports
│           └── Settings
│
├── Execution Center
│   ├── Active Runs
│   ├── Execution Queue
│   └── Workers
│
├── Analytics
│   ├── Performance Overview
│   └── Test Comparison
│
└── Administration
    ├── Users
    ├── Organizations
    ├── Roles
    ├── Plugins
    ├── Audit Logs
    └── System Settings
```

## 7.2 Main Screens

| Screen | Main Purpose |
|---|---|
| Login | Authentication |
| Dashboard | Overall testing summary |
| Workspace | Workspace navigation |
| Project Overview | Project activity |
| API Builder | Request creation |
| Collection Editor | API organization |
| Test Designer | Functional test creation |
| Performance Designer | Workload configuration |
| Script Editor | Custom engine scripts |
| Execution Center | Execution management |
| Live Monitoring | Real-time metrics |
| Test Report | Result analysis |
| Comparison | Run-to-run comparison |
| Worker Management | Execution infrastructure |
| Administration | Platform governance |

## 7.3 UX Principles

- Clean, modern, professional interface.
- Desktop-first responsive layout.
- Dark mode dan light mode.
- Clear execution status.
- Minimal navigation complexity.
- Reusable UI components.
- Visual configuration, bukan mandatory scripting.
- Advanced mode untuk experienced engineers.
- Error messages menjelaskan penyebab dan corrective action.
- Destructive actions membutuhkan konfirmasi.
- Long-running executions tidak boleh bergantung pada browser session tetap terbuka.

---

# 8. Main User Workflows

## 8.1 API Functional Testing

```text
Login
  ↓
Select Workspace
  ↓
Select Project
  ↓
Create Collection
  ↓
Create API Request
  ↓
Configure Authentication
  ↓
Configure Environment
  ↓
Execute Request
  ↓
Create Test Case
  ↓
Configure Assertions
  ↓
Add to Test Suite
  ↓
Execute Test Suite
  ↓
Review Results
  ↓
Export Report
```

Expected result: user dapat melakukan API functional testing secara terstruktur dan menyimpan hasil execution.

## 8.2 Performance Testing

```text
Login
  ↓
Select Project
  ↓
Create Performance Test
  ↓
Select Request / Scenario
  ↓
Select Environment
  ↓
Configure Workload
  ↓
Configure Threshold
  ↓
Validate Configuration
  ↓
Pre-execution Safety Check
  ↓
Select Execution Worker
  ↓
Start Test
  ↓
Monitor Real-time Metrics
  ↓
Complete / Stop Test
  ↓
Analyze Results
  ↓
Generate Report
```

## 8.3 CI/CD Performance Testing

```text
Git Push
  ↓
CI/CD Pipeline
  ↓
Authenticate CLI
  ↓
Trigger Execution
  ↓
Execution Queue
  ↓
Worker Executes Test
  ↓
Collect Metrics
  ↓
Evaluate Threshold
  ↓
Return Execution Status
  ↓
Pipeline Pass / Fail
```

## 8.4 Functional-to-Performance Reuse

```text
Create Functional Scenario
  ↓
Validate Functional Steps
  ↓
Select "Create Performance Test"
  ↓
Reuse Compatible Requests
  ↓
Configure Workload
  ↓
Review Generated Scenario
  ↓
Execute Performance Test
```

---

# 9. Execution Engine & Protocol Strategy

## 9.1 Engine-Agnostic Core

Domain core tidak boleh bergantung pada k6, JMeter, atau library transport tertentu.

Core menggunakan konsep platform seperti:

- TestDefinition.
- TestScenario.
- WorkloadProfile.
- Execution.
- ExecutionAssignment.
- ExecutionStatus.
- TestResult.
- MetricSample.
- EngineCapability.

Engine adapter menerjemahkan platform execution input ke konfigurasi engine dan menerjemahkan output engine ke canonical result model.

## 9.2 Capability Discovery

Setiap engine harus mendeklarasikan capability, antara lain:

- Supported protocols.
- Supported workload models.
- Supported controls.
- Supported metrics.
- Supported script format.
- Distributed execution support.
- Pause/resume support.
- Result streaming support.

UI hanya menampilkan konfigurasi yang didukung engine yang dipilih. Unsupported capability harus dijelaskan, bukan diabaikan.

## 9.3 Engine Versioning

Setiap execution harus merekam:

- Engine identifier.
- Engine version.
- Adapter version.
- Script/runtime version jika relevan.
- Execution configuration version.

Perubahan engine tidak boleh membuat historical result kehilangan konteks.

## 9.4 Load Generator Validity

Platform harus dapat mengamati resource load generator agar saturation pada generator tidak disalahartikan sebagai bottleneck target.

Report harus membedakan:

- Target application metrics.
- Load generator metrics.
- Control plane metrics.
- Worker execution metrics.

---

# 10. Non-Functional Requirements

## 10.1 Performance

| ID | Requirement | Initial Target |
|---|---|---|
| NFR-PERF-001 | Backend API latency | P95 < 300 ms untuk ordinary CRUD di kondisi benchmark yang disepakati |
| NFR-PERF-002 | Dashboard loading | < 3 detik di kondisi benchmark yang disepakati |
| NFR-PERF-003 | Metrics update | Default 1–2 detik, configurable |
| NFR-PERF-004 | Async execution | Tidak memblokir API request lifecycle |
| NFR-PERF-005 | Large execution | Mendukung worker scaling yang dapat dikonfigurasi |
| NFR-PERF-006 | Result processing | Mendukung batch ingestion |

Target ini berlaku untuk control plane, bukan jaminan performa target application atau load generator.

## 10.2 Scalability

- Horizontal scaling untuk stateless backend.
- Worker scaling independen.
- Execution queue.
- Configurable concurrency.
- Distributed execution support.
- Partitioned metrics ingestion jika diperlukan.
- Database indexing dan retention.
- Storage terpisah untuk artifact besar.

## 10.3 Reliability

- Graceful shutdown.
- Worker heartbeat.
- Execution recovery strategy.
- Idempotent execution commands.
- Retry policy untuk transient failures.
- Durable execution state.
- Structured logging.
- Health checks.
- Database backup and restore.
- Reconciliation untuk execution yang statusnya tidak pasti setelah restart.

## 10.4 Security

- Password hashing dengan algoritma modern.
- TLS support.
- RBAC.
- Secret encryption.
- Audit log.
- Input validation.
- SQL injection protection.
- XSS protection.
- CSRF protection jika menggunakan cookie-based authentication.
- Rate limiting.
- Secure session management.
- Dependency scanning.
- Container security.
- SSRF protection.
- Network egress control.
- File upload validation.
- Sensitive information masking.

## 10.5 Maintainability

- DDD wajib.
- Clean Architecture wajib.
- SOLID wajib.
- TDD wajib.
- Automated tests.
- Static analysis.
- Code linting.
- Dependency management.
- Architecture tests.
- Structured documentation.
- Versioned API contracts.

## 10.6 Portability

- Linux container support.
- Docker Compose.
- Persistent volumes.
- Configurable environment variables.
- No hardcoded host paths.
- Configurable storage backend.
- Local dan server deployment.

## 10.7 Observability

- Structured application logs.
- Metrics.
- Health endpoints.
- Worker health monitoring.
- Execution traceability.
- Correlation ID.
- Error tracking.
- Audit events.

---

# 11. Security & Responsible Load Testing

Security dan responsible execution merupakan persyaratan wajib.

Load testing dapat menghasilkan trafik besar dan berdampak terhadap layanan yang diuji. Platform harus menyediakan mekanisme pengendalian sebelum execution.

## 11.1 Target Authorization

- User harus memiliki hak untuk menguji target.
- Target harus terdaftar dalam project atau environment.
- Production target membutuhkan explicit authorization.
- Organization dapat menerapkan approved target allowlist.
- Sistem harus menyediakan mekanisme pemblokiran target yang tidak diizinkan.

## 11.2 Execution Safety

Sebelum execution:

1. Validate target URL.
2. Resolve destination IP.
3. Validate network access policy.
4. Check approved target.
5. Check configured workload limits.
6. Check worker capacity.
7. Check execution quota.
8. Display execution summary.
9. Require confirmation jika policy mewajibkan.

## 11.3 Network Security

- Block localhost dan private network targets secara default untuk deployment yang tidak secara eksplisit mengizinkannya.
- Protect against DNS rebinding.
- Revalidate redirect destinations.
- Prevent access to cloud metadata endpoints.
- Restrict outbound network access.
- Support controlled internal network testing melalui administrator-managed policy.
- Apply execution-level network policies.

Internal testing tetap dimungkinkan untuk organisasi yang mengoperasikan sistem sendiri, tetapi memerlukan konfigurasi dan otorisasi eksplisit.

## 11.4 Resource Protection

- Maximum VU.
- Maximum arrival rate.
- Maximum duration.
- Maximum execution concurrency.
- Maximum payload size.
- Worker resource limits.
- Emergency stop.
- Administrator kill switch.

## 11.5 Secret Protection

- Do not expose secrets in logs.
- Mask sensitive response fields.
- Encrypt stored credentials.
- Avoid including secrets in exported reports.
- Prevent accidental secret transmission to AI providers.

## 11.6 Auditability

Setiap execution harus menyimpan:

- Initiating user.
- Target.
- Environment.
- Workload.
- Authorization status.
- Start/end time.
- Worker.
- Execution result.
- Cancellation reason jika ada.

---

# 12. Deployment Architecture & Operations

## 12.1 Deployment Modes

### Mode A — Local Development

Developer menjalankan platform melalui Docker Compose.

### Mode B — Single Server

Seluruh komponen berjalan pada satu server.

### Mode C — Distributed Self-hosted

Control plane dan execution workers dapat dijalankan pada beberapa mesin.

## 12.2 Logical Deployment Components

```text
Docker Compose / Container Platform
│
├── Frontend
├── Backend API
├── Execution Orchestrator
├── Functional Runner
├── Performance Worker
│   └── k6
├── PostgreSQL
├── Redis
├── Metrics Collector
├── Artifact Storage
└── Reverse Proxy
```

Komponen dapat dipisahkan menjadi service atau process sesuai kebutuhan deployment.

## 12.3 Configuration

Konfigurasi menggunakan environment variables atau configuration files.

Contoh:

```env
APP_ENV=production
APP_PORT=8080

DATABASE_HOST=postgres
DATABASE_PORT=5432

REDIS_HOST=redis
REDIS_PORT=6379

EXECUTION_ENGINE_DEFAULT=k6

WORKER_MAX_CONCURRENCY=5
WORKER_HEARTBEAT_INTERVAL=10s

METRICS_RETENTION_DAYS=30
```

Contoh tersebut ilustratif, bukan konfigurasi production final.

## 12.4 Storage Strategy

**PostgreSQL**
- Users.
- Organizations.
- Workspaces.
- Projects.
- Collections.
- Test definitions.
- Execution metadata.
- Aggregated results.
- Audit records.

**Redis**
- Queue/cache.
- Execution coordination.
- Temporary state.
- Real-time event distribution.

**Artifact storage**
- Script files.
- Imported files.
- Raw execution artifacts.
- Reports.
- Large test result files.

Storage backend harus dapat berkembang dari local volume ke object storage.

## 12.5 Backup & Recovery

- Database backup dan restore harus terdokumentasi.
- Artifact backup harus dapat dikonfigurasi.
- Recovery procedure harus diuji.
- Execution yang sedang berjalan ketika service restart harus direkonsiliasi.
- Backup harus mengikuti retention dan encryption policy.

---

# 13. Data Management Requirements

## 13.1 Core Data Entity Candidates

1. User.
2. Organization.
3. OrganizationMember.
4. Role.
5. Permission.
6. Workspace.
7. WorkspaceMember.
8. Project.
9. Environment.
10. EnvironmentVariable.
11. Secret.
12. Collection.
13. CollectionFolder.
14. APIRequest.
15. RequestAuthentication.
16. TestCase.
17. TestStep.
18. Assertion.
19. TestSuite.
20. TestScenario.
21. ScenarioStep.
22. WorkloadProfile.
23. PerformanceTest.
24. Execution.
25. ExecutionWorker.
26. ExecutionAssignment.
27. ExecutionMetric.
28. ExecutionLog.
29. TestResult.
30. TestReport.
31. Engine.
32. Plugin.
33. AuditLog.

Daftar ini merupakan kandidat awal, bukan keputusan aggregate final. Aggregate boundaries, ownership, lifecycle, dan persistence model harus ditentukan melalui Domain Design.

## 13.2 Data Ownership

- Organization owns organization-level configuration.
- Workspace owns workspace-level resources.
- Project owns testing artifacts.
- Execution owns immutable execution context and result references.
- Worker owns runtime health and capacity state.

## 13.3 Versioning

Versioning wajib untuk:

- API collections.
- Test cases.
- Test suites.
- Performance scenarios.
- Scripts.
- Workload profiles.
- Plugin contracts.

Setiap execution harus terhubung dengan versi konfigurasi yang digunakan agar dapat direproduksi.

## 13.4 Data Integrity

- Referential integrity harus dijaga.
- Execution harus menyimpan snapshot konfigurasi yang diperlukan untuk reproduksi.
- Penghapusan resource yang masih direferensikan harus mengikuti lifecycle policy.
- Result dan audit records harus memiliki retention policy yang eksplisit.
- Timestamp disimpan dalam format konsisten dan ditampilkan sesuai timezone pengguna.

---

# 14. API Design Requirements

## 14.1 API Standards

- RESTful API.
- JSON request/response.
- OpenAPI documentation.
- Versioned endpoints.
- Consistent error response.
- Pagination.
- Filtering.
- Sorting.
- Idempotency untuk operasi yang memerlukannya.
- Correlation ID.
- Authentication dan authorization.

## 14.2 Standard Error Response

Contoh:

```json
{
  "success": false,
  "error": {
    "code": "EXECUTION_LIMIT_EXCEEDED",
    "message": "Execution exceeds configured limits",
    "details": []
  },
  "metadata": {
    "correlation_id": "request-id"
  }
}
```

## 14.3 Real-Time Communication

WebSocket atau Server-Sent Events dapat digunakan untuk:

- Execution status.
- Live metrics.
- Worker status.
- Execution logs.
- Notifications.

REST tetap menjadi interface utama untuk resource management.

## 14.4 API Compatibility

- Breaking changes harus melalui API versioning.
- Deprecated endpoints harus memiliki migration notice.
- API contract harus diuji melalui contract tests.
- CLI dan UI harus menggunakan public application APIs atau application services yang disepakati, bukan mengakses database secara langsung.

---

# 15. Licensing & Open-Source Strategy

## 15.1 Licensing

Rekomendasi awal: Apache License 2.0.

Alasan:

- Open-source friendly.
- Mendukung penggunaan komersial.
- Memiliki ketentuan paten.
- Memungkinkan pengembangan oleh komunitas dan enterprise.

Final license harus ditetapkan sebelum public release.

Third-party dependencies, engine binaries, extensions, dan plugin harus memiliki license compatibility review. License produk tidak otomatis mengubah license dependency pihak ketiga.

## 15.2 Open-Source Distribution

Repository harus memiliki:

- LICENSE.
- README.
- CONTRIBUTING.
- CODE_OF_CONDUCT.
- SECURITY.md.
- Documentation.
- Docker Compose.
- Environment example.
- Architecture documentation.
- Release notes.
- Dependency/license inventory.

## 15.3 Product Edition Strategy

### Community Edition

- Self-hosted.
- API workspace.
- Functional testing.
- k6 performance testing.
- Basic monitoring.
- Reports.
- CLI.
- Docker deployment.

### Enterprise Edition — Future Consideration

- Advanced RBAC.
- SSO.
- Advanced audit.
- Team governance.
- Distributed worker management.
- Advanced quotas.
- Enterprise integrations.
- Centralized administration.

Core testing capability sebaiknya tetap tersedia di open-source edition. Batas antara Community dan Enterprise harus didefinisikan transparan sebelum komersialisasi.

---

# 16. Product Roadmap

## Phase 0 — Product Foundation

**Objective:** Finalisasi desain dan fondasi development.

Deliverables:

- Ultimate PRD.
- Product gap analysis.
- Bounded Context.
- Domain Design.
- C4 Architecture.
- ERD.
- API Specification.
- UI/UX Specification.
- Development standards.
- Repository structure.
- CI/CD foundation.

## Phase 1 — Platform Foundation

Deliverables:

- Authentication.
- Organization.
- Workspace.
- Project.
- RBAC.
- PostgreSQL integration.
- Redis integration.
- Docker Compose.
- Audit foundation.

## Phase 2 — API Workspace

Deliverables:

- Request builder.
- Response viewer.
- Collection management.
- Environment.
- Variables.
- Authentication configuration.
- OpenAPI import.
- Postman collection import.

## Phase 3 — Functional Testing

Deliverables:

- Test case.
- Test suite.
- Assertions.
- Request chaining.
- Data-driven testing.
- Execution history.
- Functional reports.

## Phase 4 — Performance Testing

Deliverables:

- k6 integration.
- Performance test designer.
- Workload profile.
- Scenario builder.
- Script editor.
- Load testing.
- Stress testing.
- Spike testing.
- Soak testing.
- Threshold configuration.

## Phase 5 — Monitoring & Reporting

Deliverables:

- Live metrics.
- Execution dashboard.
- Result aggregation.
- Test comparison.
- Worker monitoring.
- HTML/PDF/CSV reports.

## Phase 6 — Automation & Distributed Execution

Deliverables:

- CLI.
- REST execution API.
- CI/CD integration.
- Worker orchestration.
- Distributed testing.
- Quota management.

## Phase 7 — Advanced Protocols & Plugins

Deliverables:

- WebSocket expansion.
- gRPC.
- SOAP.
- GraphQL improvements.
- Kafka.
- RabbitMQ.
- MQTT.
- Plugin registry and lifecycle.

## Phase 8 — AI & Enterprise

Deliverables:

- AI test generation.
- AI performance analysis.
- AI optimization recommendations.
- Enterprise SSO.
- Advanced governance.
- Advanced reporting.
- Enterprise integrations.

Phases dapat berjalan paralel apabila dependency dan interface telah disetujui. Perpindahan fase didasarkan pada acceptance criteria, bukan hanya penyelesaian UI.

---

# 17. MVP Definition & Release Criteria

## 17.1 MVP Goal

MVP harus menjadi aplikasi yang benar-benar dapat digunakan untuk membuat API request, melakukan functional testing, menjalankan performance testing menggunakan k6, memonitor hasil, dan menghasilkan report.

MVP bukan sekadar prototype UI.

## 17.2 MVP Features

| Module | MVP |
|---|---|
| Authentication | Yes |
| Workspace | Yes |
| Project | Yes |
| RBAC | Basic |
| API Request Builder | Yes |
| Collection | Yes |
| Environment | Yes |
| REST/HTTP | Yes |
| OpenAPI Import | Yes |
| Functional Test | Yes |
| Assertion | Yes |
| Test Suite | Yes |
| Request Chaining | Yes |
| k6 Integration | Yes |
| Load Testing | Yes |
| Stress Testing | Yes |
| Spike Testing | Yes |
| Soak Testing | Yes |
| Workload Designer | Yes |
| Script Editor | Yes |
| Execution Management | Yes |
| Live Metrics | Yes |
| Test History | Yes |
| Basic Reports | Yes |
| Docker Deployment | Yes |
| CLI | Basic |
| Distributed Workers | Later |
| AI Assistant | Later |
| Advanced Plugins | Later |

## 17.3 MVP Acceptance Criteria

MVP dianggap siap apabila:

1. User dapat login.
2. User dapat membuat workspace dan project.
3. User dapat membuat HTTP request.
4. User dapat menyimpan collection.
5. User dapat mengelola environment.
6. User dapat menjalankan functional test.
7. User dapat membuat assertions.
8. User dapat menjalankan chained requests.
9. User dapat membuat performance test.
10. User dapat mengatur VU dan duration.
11. User dapat menjalankan k6.
12. User dapat melihat real-time metrics.
13. User dapat menghentikan execution.
14. User dapat melihat execution history.
15. User dapat melihat threshold result.
16. User dapat membandingkan hasil test.
17. User dapat mengekspor report.
18. User dapat menjalankan platform menggunakan Docker Compose.
19. Sistem mengontrol workload berdasarkan authorization dan resource limits.
20. Seluruh execution dapat ditelusuri melalui execution ID.

## 17.4 Release Gate

Selain acceptance criteria di atas:

- Critical security findings harus ditangani.
- Database migration harus dapat diuji.
- Backup/restore harus diverifikasi.
- Documentation instalasi harus lengkap.
- Error dan recovery path harus diuji.
- Load generator resource usage harus terlihat.
- Known limitations harus didokumentasikan.
- Tidak boleh ada klaim distributed testing sebelum distributed execution benar-benar diimplementasikan dan diuji.

---

# 18. Testing & Quality Strategy

## 18.1 Unit Testing

- Domain entities.
- Value objects.
- Aggregates.
- Domain services.
- Application use cases.
- Business rules.
- Validation.

## 18.2 Integration Testing

- PostgreSQL.
- Redis.
- Queue.
- Execution engine.
- Metrics ingestion.
- Storage.
- API integrations.

## 18.3 Contract Testing

- REST API contracts.
- Engine adapter contracts.
- Plugin contracts.
- Worker communication contracts.

## 18.4 End-to-End Testing

Critical journeys:

- Login and create project.
- Create API collection.
- Execute functional test.
- Create performance scenario.
- Execute k6 test.
- Monitor live metrics.
- Generate report.
- Execute via CLI.

## 18.5 Performance Testing of the Platform

Platform itu sendiri wajib diuji:

- API throughput.
- Concurrent user behavior.
- Execution scheduling throughput.
- Metrics ingestion throughput.
- Large result handling.
- Worker scaling.
- Database performance.

## 18.6 Security Testing

- Authentication testing.
- Authorization testing.
- OWASP application security testing.
- SSRF testing.
- Secret leakage testing.
- Container security testing.
- Plugin isolation testing.

---

# 19. Risks & Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| Scope terlalu besar | Development terlambat | Phase-based delivery |
| k6 engine limitation | Protocol coverage terbatas | Engine abstraction |
| Worker bottleneck | Hasil test tidak akurat | Resource monitoring |
| Metrics volume tinggi | Database overload | Batch ingestion dan retention |
| Execution crash | Incomplete result | Durable state dan recovery |
| Arbitrary script execution | Security risk | Sandbox dan resource isolation |
| SSRF | Internal network exposure | Egress restrictions dan destination validation |
| Complex domain | Maintainability rendah | Bounded contexts dan domain ownership |
| Inconsistent metrics | Report tidak akurat | Standard metric definitions |
| Distributed coordination | Execution failure | Worker protocol dan idempotency |
| Engine version drift | Result tidak comparable | Record engine dan adapter version |
| Storage growth | Infrastructure cost | Retention dan artifact lifecycle |
| Invalid workload interpretation | Misleading report | Workload semantics dan generator health metrics |

---

# 20. Constraints & Assumptions

1. Produk dikembangkan secara open-source.
2. Produk diutamakan self-hosted.
3. Docker merupakan deployment baseline.
4. Golang menjadi backend utama.
5. React dan TypeScript menjadi frontend utama.
6. PostgreSQL menjadi primary relational database.
7. Redis menjadi cache dan coordination infrastructure.
8. k6 menjadi performance engine utama.
9. Functional runner merupakan bagian dari platform.
10. Execution engine harus dapat diganti atau diperluas.
11. Core business rules tidak boleh bergantung pada engine tertentu.
12. Platform tidak boleh mengasumsikan semua protokol memiliki kapabilitas testing yang sama.
13. Distributed testing bukan persyaratan MVP.
14. AI bukan dependency untuk execution.
15. Semua execution harus melewati authorization dan safety checks.
16. Target performa platform harus divalidasi melalui benchmark dengan spesifikasi environment yang jelas.
17. Feature compatibility harus didokumentasikan per engine dan engine version.
18. Tidak ada klaim kapasitas VU tanpa pengujian pada konfigurasi generator yang terukur.

---

# 21. Definition of Done

Setiap fitur dinyatakan selesai apabila:

- PRD requirement telah dipenuhi.
- Domain design telah disetujui.
- Architecture compliance terpenuhi.
- Unit test tersedia.
- Integration test tersedia jika diperlukan.
- Acceptance criteria terpenuhi.
- Error handling tersedia.
- Logging dan observability tersedia.
- Security review selesai untuk fitur berisiko.
- API documentation diperbarui.
- Developer documentation diperbarui.
- Tidak ada regression pada fitur yang sudah berjalan.
- Code review selesai.
- CI pipeline berhasil.

---

# 22. Mandatory Engineering Standards

Seluruh AI agents dan developer wajib mengikuti ketentuan berikut. Standar ini bersifat mandatory, bukan rekomendasi opsional.

## 22.1 Domain-Driven Design

DDD wajib.

Ketentuan:

- Identify bounded contexts.
- Define ubiquitous language.
- Define aggregate boundaries.
- Use entities and value objects appropriately.
- Define domain invariants.
- Use domain services only when necessary.
- Use domain events when meaningful.
- Avoid anemic domain models.
- Avoid unnecessary abstractions.
- Keep domain independent from infrastructure and frameworks.

## 22.2 Clean Architecture

Dependency direction:

```text
Delivery / Presentation
          |
          v
Application
          |
          v
Domain
          ^
          |
Infrastructure
```

Domain tidak boleh bergantung pada infrastructure, framework, transport, database, atau execution engine.

Dependency inversion harus diterapkan melalui abstraction yang dimiliki layer yang membutuhkan dependency tersebut.

## 22.3 SOLID

Seluruh implementation harus mengikuti:

- Single Responsibility Principle.
- Open/Closed Principle.
- Liskov Substitution Principle.
- Interface Segregation Principle.
- Dependency Inversion Principle.

## 22.4 Test-Driven Development

Mandatory cycle:

```text
RED
  ↓
GREEN
  ↓
REFACTOR
```

Business rules dikembangkan dengan test terlebih dahulu.

TDD tidak boleh hanya menjadi dokumentasi. Pull request harus menunjukkan test yang relevan dan hasil eksekusinya.

## 22.5 Legacy Code Protection

- Tidak melakukan refactoring yang tidak berkaitan.
- Tidak mengubah modul lain tanpa kebutuhan.
- Enhancement bersifat incremental.
- Backward compatibility harus diperhatikan.
- Perubahan contract harus terdokumentasi.
- Hindari perubahan massal yang tidak diperlukan.

## 22.6 Coding Standards

- Clear naming.
- Small and cohesive functions.
- Explicit error handling.
- No swallowed errors.
- No business logic in delivery handlers.
- No infrastructure concerns in domain.
- Avoid global mutable state.
- Avoid unnecessary dependencies.
- Use context cancellation and timeout appropriately.
- Use structured logging.
- Validate untrusted inputs.
- Document non-obvious decisions.

## 22.7 Testing Standards

- Unit tests untuk domain rules dan use cases.
- Integration tests untuk persistence dan adapters.
- Contract tests untuk engine dan plugin interfaces.
- E2E tests untuk critical workflows.
- Regression tests untuk bug fixes.
- Deterministic tests sebisa mungkin.
- External dependencies harus diisolasi atau menggunakan test containers/fakes sesuai kebutuhan.

---

# 23. REA Delivery Workflow

REA digunakan sebagai engineering workflow yang design-first.

REA tidak boleh langsung membuat keseluruhan aplikasi hanya dari satu instruksi umum.

## 23.1 Agent Responsibilities

### Product Manager Agent

- Analyze PRD.
- Identify ambiguity.
- Maintain requirement traceability.
- Define user stories.
- Define acceptance criteria.
- Manage product scope.

### Domain Architect Agent

- Identify bounded contexts.
- Define ubiquitous language.
- Design aggregates.
- Define entities and value objects.
- Define domain services.
- Define domain events.
- Validate business invariants.

### Solution Architect Agent

- Design C4 diagrams.
- Define component boundaries.
- Define dependency rules.
- Design integration contracts.
- Evaluate scalability and security.
- Review technology decisions.

### Backend Engineer Agent

- Implement Go backend.
- Follow DDD and Clean Architecture.
- Apply TDD.
- Implement application use cases.
- Implement infrastructure adapters.
- Maintain API contracts.

### Frontend Engineer Agent

- Implement React and TypeScript.
- Build reusable components.
- Implement application workflows.
- Integrate API contracts.
- Maintain UI state and error handling.
- Follow UX specification.

### Performance Engineer Agent

- Integrate k6.
- Design execution adapters.
- Implement workload translation.
- Implement worker execution.
- Collect and normalize metrics.
- Validate load generator health.

### QA / Security Agent

- Review test coverage.
- Validate acceptance criteria.
- Perform regression testing.
- Review security risks.
- Review architecture compliance.
- Validate release gates.

## 23.2 Mandatory Design Artifacts

Sebelum implementation dimulai, REA harus menghasilkan:

1. PRD gap analysis.
2. Product glossary.
3. Bounded Context Map.
4. Context-specific domain models.
5. Aggregate and invariant specification.
6. Domain event catalogue.
7. C4 System Context.
8. C4 Container Diagram.
9. Component diagrams untuk bounded contexts penting.
10. Clean Architecture package structure.
11. ERD dan data ownership.
12. Database migration strategy.
13. OpenAPI specification.
14. Engine adapter contract.
15. Worker communication contract.
16. Metrics canonical model.
17. Security threat model.
18. UI/UX information architecture.
19. User stories dan acceptance criteria.
20. Jira task breakdown.
21. Mandays estimation.
22. Implementation sequence dan dependency map.

## 23.3 Design Approval Gate

REA harus:

1. Membaca dokumen PRD secara keseluruhan.
2. Mengidentifikasi requirement ambigu atau konflik.
3. Membuat gap analysis.
4. Mengajukan keputusan yang benar-benar memerlukan product owner.
5. Menyusun design artifacts.
6. Memvalidasi konsistensi antar-artifact.
7. Menampilkan keputusan dan trade-offs.
8. Menunggu approval sebelum implementation.

REA tidak boleh mengarang keputusan produk yang belum ditetapkan dan tidak boleh diam-diam mengubah scope.

## 23.4 Mandatory Implementation Workflow

```text
PRODUCT REQUIREMENTS
        |
        v
PRD GAP ANALYSIS
        |
        v
DOMAIN INQUIRY
        |
        v
BOUNDED CONTEXT DESIGN
        |
        v
DOMAIN MODEL
        |
        v
CLEAN ARCHITECTURE DESIGN
        |
        v
ERD & DATA DESIGN
        |
        v
API SPECIFICATION
        |
        v
JIRA TASK BREAKDOWN
        |
        v
MANDAYS ESTIMATION
        |
        v
DESIGN APPROVAL
        |
        v
TDD IMPLEMENTATION
        |
        v
INTEGRATION TESTING
        |
        v
ARCHITECTURE REVIEW
        |
        v
SECURITY & REGRESSION REVIEW
        |
        v
RELEASE
```

## 23.5 Requirement Traceability

Setiap functional requirement harus dapat ditelusuri ke:

- Bounded context.
- Domain concept.
- Use case.
- API contract jika ada.
- UI workflow jika ada.
- Jira story/task.
- Test case.
- Acceptance result.

Requirement ID dalam PRD harus dipertahankan atau memiliki mapping eksplisit jika direvisi.

---

# 24. Final Product Acceptance Vision

Produk mencapai visi utamanya ketika user dapat melakukan seluruh proses berikut dalam satu platform:

1. Membuat project.
2. Import OpenAPI specification.
3. Membuat dan mengelola API collection.
4. Melakukan API exploration.
5. Membuat functional test.
6. Membuat test suite.
7. Membuat chained scenario.
8. Menggunakan kembali compatible scenario sebagai performance test.
9. Mengatur workload dan threshold.
10. Menjalankan load test menggunakan k6.
11. Menjalankan stress, spike, dan soak testing.
12. Memantau metrics secara real-time.
13. Menghentikan execution dengan aman.
14. Melihat detail hasil execution.
15. Membandingkan hasil antar-execution.
16. Menghasilkan report.
17. Menjalankan test melalui CLI.
18. Mengintegrasikan testing ke CI/CD.
19. Mengembangkan execution engine melalui plugin.
20. Mengoperasikan semuanya secara self-hosted.

## Ultimate Product Vision

Satu platform open-source yang menggabungkan API Development, Functional Testing, Performance Engineering, Automation, Monitoring, dan Analytics ke dalam satu ekosistem yang modular, extensible, secure, dan enterprise-ready.

---

# 25. Glossary

| Term | Definition |
|---|---|
| API Workspace | Area untuk membuat dan mengelola API requests |
| Collection | Kumpulan API requests yang terorganisasi |
| Environment | Konfigurasi target dan variables untuk suatu konteks |
| Functional Test | Pengujian perilaku dan kebenaran API |
| Test Case | Unit pengujian dengan steps dan assertions |
| Test Suite | Kumpulan test case yang dieksekusi bersama |
| Test Scenario | Alur interaksi yang terdiri dari beberapa steps |
| Workload Profile | Definisi pola beban yang digunakan dalam performance test |
| Virtual User (VU) | Simulated user yang menjalankan iteration |
| Arrival Rate | Target frekuensi memulai iteration |
| RPS | Requests per second |
| TPS | Transactions per second; definisi transaksi harus dinyatakan |
| Latency | Waktu respons sesuai definisi pengukuran |
| P95 | Persentil ke-95 dari distribusi pengukuran |
| Load Test | Pengujian pada beban yang diharapkan |
| Stress Test | Pengujian untuk menemukan batas atau degradasi sistem |
| Spike Test | Pengujian perubahan beban secara mendadak |
| Soak Test | Pengujian beban berkelanjutan dalam durasi panjang |
| Execution | Satu proses menjalankan test definition |
| Worker | Process atau node yang menjalankan execution |
| Execution Engine | Teknologi yang mengeksekusi test |
| Adapter | Komponen penerjemah antara platform dan teknologi eksternal |
| Plugin | Extension yang menambahkan capability platform |
| Control Plane | Komponen pengelola konfigurasi dan lifecycle execution |
| Data Plane | Komponen yang menjalankan workload dan menghasilkan data |
| Threshold | Kriteria evaluasi hasil test |
| Artifact | File atau data hasil execution yang disimpan |
| Bounded Context | Batas model domain dengan ubiquitous language yang konsisten |
| Aggregate | Unit konsistensi domain yang memiliki root |
| Value Object | Objek domain yang ditentukan oleh nilainya |
| Domain Event | Fakta bahwa sesuatu telah terjadi dalam domain |

---

# DOCUMENT END

**Version:** 1.0  
**Status:** Draft — Baseline for Product & Engineering Design  
**Next activity:** PRD Gap Analysis → Domain Design → Architecture Specification → Approval → Implementation
