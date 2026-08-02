# API Endpoint Classification & Authorization Matrix

This document provides a formal classification matrix for all API endpoints in the system, specifying the required role level, effect type, input schema, data classification, and rate limits.

## Authorization Hierarchy & Roles

1. **`public`**: Unauthenticated public endpoints. Fast health probes, OAuth config/discovery, public installer scripts, and isolated voice dialogue contracts.
2. **`family`**: Authenticated session required (via `n1_sync_auth` HttpOnly cookie, `n1_google_auth` HttpOnly cookie, or valid bearer token).
3. **`owner-admin`**: High-privilege administrative actions (system archives, repository write sync, AST auto-patching, SSH key registration, audit inspection). Requires owner token, admin authorization secret, or signed owner session.
4. **`internal-service`**: Restricted inter-service RPC communications.
5. **`disabled`**: Explicitly disabled or deprecated endpoints.

---

## Endpoint Classification Matrix

| Endpoint Path | HTTP Method(s) | Role Level | Effect Type | Data Classification | Rate Limit (req/min) | Input Schema / Summary |
|---|---|---|---|---|---|---|
| `/api/health/liveness` | `GET` | `public` | `READ` | `PUBLIC` | 120 | None. Returns container liveness & process status. |
| `/api/health/readiness` | `GET` | `public` | `READ` | `PUBLIC` | 120 | None. Evaluates workspace, DB & memcached sub-states. |
| `/api/health` | `GET` | `public` | `READ` | `PUBLIC` | 120 | None. Health probe alias. |
| `/api/auth/nexus/config` | `GET` | `public` | `READ` | `PUBLIC` | 60 | None. Discovers Nexus OAuth client configuration. |
| `/api/auth/nexus/url` | `GET` | `public` | `READ` | `PUBLIC` | 60 | Optional `client_id` query param. Returns GitHub OAuth URL. |
| `/api/auth/nexus/login` | `GET` | `public` | `AUTH_HANDSHAKE` | `PUBLIC` | 30 | Redirects browser to GitHub OAuth authorization. |
| `/api/auth/nexus/callback` | `GET` | `public` | `AUTH_HANDSHAKE` | `PUBLIC` | 30 | `code`, `state` query parameters. Validates state CSRF. |
| `/api/auth/nexus/handshake` | `POST` | `public` | `AUTH_HANDSHAKE` | `PUBLIC` | 30 | `{ code: string }`. Exchanges code for signed session cookie. |
| `/api/auth/nexus/me` | `GET` | `public` | `READ` | `PUBLIC` | 60 | None. Checks current Nexus authenticated session status. |
| `/api/auth/nexus/logout` | `POST` | `public` | `AUTH_HANDSHAKE` | `PUBLIC` | 30 | Clears Nexus session cookies. |
| `/api/auth/github/me` | `GET` | `public` | `READ` | `PUBLIC` | 60 | Alias for `/api/auth/nexus/me`. |
| `/api/auth/google/config` | `GET` | `public` | `READ` | `PUBLIC` | 60 | None. Discovers Google OAuth configuration. |
| `/api/auth/google/keyless` | `GET` | `public` | `AUTH_HANDSHAKE` | `PUBLIC` | 30 | Initiates zero-key Google session authentication. |
| `/api/auth/google/me` | `GET` | `public` | `READ` | `PUBLIC` | 60 | None. Checks current Google authenticated session status. |
| `/api/auth/google/logout` | `POST` | `public` | `AUTH_HANDSHAKE` | `PUBLIC` | 30 | Clears Google session cookies. |
| `/api/agent-command/chat` | `POST` | `public` | `READ` | `PUBLIC` | 60 | `{ command: string, history?: Array }`. Public voice agent contract. Strictly isolated to conversational agent commands. |
| `/install.sh` | `GET` | `public` | `READ` | `PUBLIC` | 60 | None. Serves N1 CLI installer script. |
| `/api/npm/info` | `GET` | `public` | `READ` | `PUBLIC` | 60 | Optional `package` query param. Returns package info. |
| `/api/nexus/repos` | `GET` | `family` | `READ` | `INTERNAL` | 60 | None. Returns user's accessible GitHub repositories. |
| `/api/nexus/status` | `GET` | `family` | `READ` | `INTERNAL` | 60 | None. Checks current workspace sync timestamp & file count. |
| `/api/system/nodes` | `GET` | `family` | `READ` | `INTERNAL` | 60 | None. Returns node topology telemetry data. |
| `/api/system/files` | `GET` | `family` | `READ` | `INTERNAL` | 60 | None. Inspects workspace file tree structure. |
| `/api/vectors/upsert` | `POST` | `family` | `MUTATING` | `INTERNAL` | 30 | `{ id: string, vector: number[], metadata: object }`. Upserts vector. |
| `/api/vectors/search` | `POST` | `family` | `READ` | `INTERNAL` | 60 | `{ vector: number[], topK?: number }`. Performs semantic search. |
| `/api/vector/reflect-canvas` | `POST` | `family` | `READ` | `INTERNAL` | 60 | `{ canvasState: object }`. Reflects canvas vector embedding. |
| `/api/db/status` | `GET` | `family` | `READ` | `INTERNAL` | 60 | None. Returns PostgreSQL database pool health. |
| `/api/db/query` | `POST` | `owner-admin` | `READ` | `CONFIDENTIAL` | 30 | `{ queryKey?: string, query?: string }`. Strictly allowlisted diagnostic queries (`HEALTH_CHECK`, `VECTOR_COUNT`, `TABLE_SCHEMA`). Arbitrary SQL disabled. |
| `/api/partners/connections` | `GET`, `POST`, `DELETE` | `family` | `MUTATING` | `INTERNAL` | 30 | Partner service credentials & connection parameters. |
| `/api/partners/connect` | `POST` | `family` | `MUTATING` | `INTERNAL` | 30 | `{ partnerId: string, config: object }`. Establishes partner link. |
| `/api/integration/connect` | `POST` | `family` | `MUTATING` | `INTERNAL` | 30 | `{ service: string, credentials: object }`. Connects integration. |
| `/v1/responses` | `POST` | `family` | `MUTATING` | `INTERNAL` | 60 | `{ model: string, messages: Array }`. OpenAI-compatible completion. |
| `/api/agents/handshake` | `POST` | `family` | `AUTH_HANDSHAKE` | `INTERNAL` | 30 | `{ agentId: string }`. Establishes agent session link. |
| `/api/agents/train` | `POST` | `family` | `MUTATING` | `INTERNAL` | 30 | `{ agentId: string, dataset: object }`. Initiates agent fine-tuning. |
| `/api/agents/integrate` | `POST` | `family` | `MUTATING` | `INTERNAL` | 30 | `{ agentId: string, target: string }`. Integrates agent capability. |
| `/api/bughunt/docker-docking` | `GET` | `family` | `READ` | `INTERNAL` | 60 | None. Returns container docking diagnostic status. |
| `/api/toolchain/catalog` | `GET` | `family` | `READ` | `INTERNAL` | 60 | None. Returns active toolchain capabilities list. |
| `/api/toolchain/execute` | `POST` | `family` | `MUTATING` | `INTERNAL` | 30 | `{ tool: string, args: object }`. Executes non-privileged tool. |
| `/api/migration/validate` | `GET` | `family` | `READ` | `INTERNAL` | 60 | None. Validates system database migration state. |
| `/api/freellm/v0.5.0/status` | `GET` | `family` | `READ` | `INTERNAL` | 60 | None. Returns FreeLLM system health. |
| `/api/freellm/v0.5.0/routes` | `GET` | `family` | `READ` | `INTERNAL` | 60 | None. Returns active FreeLLM provider routes. |
| `/api/freellm/v0.5.0/generate` | `POST` | `family` | `MUTATING` | `INTERNAL` | 30 | `{ prompt: string, model?: string }`. Generates text completion. |
| `/api/freellm/v0.5.0/ade-check` | `POST` | `family` | `READ` | `INTERNAL` | 60 | `{ text: string }`. Runs ADE validation check on model output. |
| `/api/npm/install-repo` | `POST` | `family` | `MUTATING` | `INTERNAL` | 15 | `{ packageName: string }`. Installs npm package into project. |
| `/api/webhooks/test` | `POST` | `family` | `MUTATING` | `INTERNAL` | 30 | `{ payload: object }`. Invokes test webhook pipeline. |
| `/api/nexus/push-manifest` | `POST` | `owner-admin` | `SYSTEM_CHANGE` | `RESTRICTED` | 15 | `{ message: string, repoUrl?: string }`. Pushes codebase manifest to remote repository. |
| `/api/nexus/mirror-sync` | `POST` | `owner-admin` | `SYSTEM_CHANGE` | `RESTRICTED` | 15 | `{ repoUrl?: string, autoPush?: boolean }`. Fetches remote changes, auto-merges non-conflicting files, flags merge conflicts. |
| `/api/nexus/pull` | `POST` | `owner-admin` | `SYSTEM_CHANGE` | `RESTRICTED` | 15 | `{ repoUrl?: string, force?: boolean }`. Pulls and updates local workspace with remote HEAD files. |
| `/api/nexus/conflicts/resolve` | `POST` | `owner-admin` | `SYSTEM_CHANGE` | `RESTRICTED` | 15 | `{ strategy: 'use-local' \| 'use-remote' \| 'manual', files?: object }`. Resolves merge conflicts and synchronizes state. |
| `/api/nexus/register-key` | `POST` | `owner-admin` | `SYSTEM_CHANGE` | `RESTRICTED` | 15 | `{ title: string, key: string }`. Registers SSH key on GitHub user account. |
| `/api/system/archive/generate` | `GET` | `owner-admin` | `SYSTEM_CHANGE` | `RESTRICTED` | 10 | Optional `full=true` query param. Exports workspace ZIP archive. |
| `/api/bughunt/diagnose` | `GET` | `owner-admin` | `READ` | `RESTRICTED` | 30 | None. Performs deep system memory and AST invariant scan. |
| `/api/bughunt/autofix` | `POST` | `owner-admin` | `SYSTEM_CHANGE` | `RESTRICTED` | 15 | `{ errorLog: string }`. Executes automatic code repair AST transformation. |
| `/api/bughunt/routes/save` | `POST` | `owner-admin` | `SYSTEM_CHANGE` | `RESTRICTED` | 15 | `{ routes: object }`. Saves dynamic system route configuration. |
| `/api/toolchain/execute/:toolId` | `POST` | `owner-admin` | `SYSTEM_CHANGE` | `RESTRICTED` | 15 | System tool execution with direct process capability. |
| `/api/audit/logs` | `GET` | `owner-admin` | `READ` | `RESTRICTED` | 30 | Optional `limit` and `role` query params. Returns security audit trail. |

---

## Security Invariants

1. **Deny-by-Default Policy**: Any requested endpoint matching `/api/*` that is not registered in this classification matrix is blocked immediately with HTTP 403 Forbidden.
2. **Mutating Effect Audit**: All POST, PUT, DELETE, and PATCH endpoints record structured audit log entries containing actor context, timestamp, status, and client metadata. No credentials or secrets are recorded.
3. **Voice Client Isolation**: The public voice endpoint (`/api/agent-command/chat`) is strictly limited to conversational agent interactions. System commands, code execution, or file modifications are blocked at the contract validation layer.
4. **Rate Limiting**: Sliding bucket rate limiters prevent endpoint abuse based on path criticality.
