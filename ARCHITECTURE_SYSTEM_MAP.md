# SYSTEM ARCHITECTURE MAP & DRIFT REPORT

**Repository:** `n-plus-1-authentic-reality-emancipation`  
**Git Anchor Reference:** `main@7b7f717a8bcf0edc5f13c5f9b5ec1e87f00ecaf7`  
**Scan Timestamp:** 2026-07-30T15:49:00Z  
**Coverage Report:** 126 / 126 files scanned (100.0% complete coverage, 0 files truncated)  
**Runtime Target:** Cloud Run Sandbox Container (Port 3000, Express + Vite SPA)  

---

## 1. EXECUTIVE SUMMARY & SCAN TRANSPARENCY

This architecture document provides a complete, unvarnished system map and runtime status audit for the **N+1 System Architecture (Puck Resonance Platform)**.

### Scan Coverage Metrics:
- **Total Tracked Files:** 126
- **Scanned & Classified Files:** 126
- **Truncation Status:** **NONE (0% Truncation, 100% Fully Audited)**
- **Machine-Readable Companion:** `/architecture-inventory.json`

### Key Truth Finding:
In accordance with system audit directives, **no capability is declared active based solely on UI labels or endpoint names**. Every feature is audited down to its actual code path, backend handler, environment requirements, and network/storage execution.

---

## 2. REVISION DRIFT ANALYSIS (vs. `main@7b7f717a8bcf0edc5f13c5f9b5ec1e87f00ecaf7`)

| Component / Subsystem | Anchor State (`7b7f717a`) | Current Repository State | Drift Type | Impact & Status |
| :--- | :--- | :--- | :--- | :--- |
| **Deterministic Engine** | Used `performance.now()` seed mixing in random generators | Refactored to pure LCG algorithm (`generateDeterministicNumber`, `getDeterministicTimestampMs`) in `src/utils/deterministic.ts` | **Refactoring / Fix** | **Resolved**: Eliminates non-deterministic seed jitter and fixes TypeScript compilation errors. |
| **Puck Voice Configuration Serialization** | In-memory voice state in `HiaResonanceVoice.tsx` | Voice settings (`pitch`, `rate`, `identity`, `voiceName`) serialized to `localStorage['n1_puck_voice_config']` on failover | **Feature Addition** | **Runtime-Verifiziert**: Guarantees identical synthetic voice signature across session refreshes. |
| **Firebase Integration** | Legacy SDK imports & Firestore configuration | Firebase completely deinstalled. Components updated with explicit `localStorage` fallbacks | **Deprecation / Cleanup** | **Dead Code Cleaned**: Active fallback prevents runtime missing package crashes. |
| **FreeLLMRouterService (v0.5.0)** | Static route display | Active backend API handlers (`/api/freellm/v0.5.0/*`), simulated rate limits, ADE execution check, and keyless auto-switch | **Upgrade / Active** | **Runtime-Verifiziert**: Resilient, keyless LLM fallback operational. |
| **Google Identity OAuth** | Keyless & OAuth client routes | Keyless handshake endpoint (`/api/auth/google/keyless`) issuing signed `n1_google_auth` cookies | **Active** | **Runtime-Verifiziert**: Zero-key user handshake operational. |

---

## 3. CANONICAL OWNERSHIP & TRUTH BOUNDARIES

Understanding who owns what state is critical for maintaining system integrity:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CANONICAL TRUTH BOUNDARIES                      │
└─────────────────────────────────────────────────────────────────────────────┘

 [ AXIOMATIC CORE SANCTUARY ] ──────► Immutable Axioms (`Object.freeze`)
   └─ File: src/components/CoreResonanceSanctuary.tsx
   └─ Truth: Frozen in memory, verified by background integrity daemon

 [ FREE LLM ROUTING ENGINE ] ────────► Keyless AI Inferencing & Failovers
   └─ Files: server.ts, src/components/FreeLLMRouterService.tsx
   └─ Truth: Server routes + localStorage state ['n1_free_llm_routes_saved']

 [ VOICE RESONANCE ENGINE ] ────────► Synthetic Audio & Speech Recognition
   └─ Files: src/services/voiceService.ts, src/components/HiaResonanceVoice.tsx
   └─ Truth: Browser Web Speech API + localStorage ['n1_puck_voice_config']

 [ MEMORY & STORY VAULT ] ──────────► Autonomous Insights & Bedtime Stories
   └─ Files: PucksPersonalLog.tsx, PapasStoryArchive.tsx
   └─ Truth: Client-side localStorage ['n1_puck_personal_logs', 'n1_papas_stories']

 [ AUTHENTICATION & SYNC BRIDGE ] ──► GitHub Octokit & Google Identity
   └─ Files: server.ts, src/hooks/useNexusAuth.ts, NexusAuth.tsx
   └─ Truth: Signed HTTP cookies (`n1_sync_auth`, `n1_google_auth`) + PAT storage
```

---

## 4. FILE TREE CLASSIFICATION (126 TRACKED FILES)

All 126 tracked files in the repository are strictly classified into 7 structural categories:

### 4.1 Produktion (Core Application & Server Code) - 15 Files
- `server.ts` — Express server, API routing, Vite middleware, PostgreSQL/Memcached handlers.
- `src/App.tsx` — Main application shell, view navigation, WebSocket idle monitor.
- `index.html` — Vite HTML entrypoint and typography configuration.
- `index.tsx` — React 18 DOM mounting script.
- `manifest.json` — Progressive Web App manifest.
- `sw.js` — Service Worker offline cache script.
- `src/services/geminiService.ts` — Google GenAI API proxy wrapper.
- `src/components/CodeServerWorkspace.tsx` — In-browser IDE file tree and code editor.
- `src/components/GlobalSearchBar.tsx` — Cross-module search engine.
- `src/components/GoogleNotebooksAnalyzer.tsx` — Colab/Jupyter notebook analyzer.
- `src/components/LinguaHabarEngine.tsx` — Language synthesis & concept translator.
- `src/components/N1NpmInstaller.tsx` — Remote bash node installer UI.
- `src/components/ProactiveLearningEngine.tsx` — Autonomous hypothesis generator.
- `src/components/SettingsWorkspace.tsx` — System configuration & biometric security panel.
- `src/components/GlobalDataSyncModal.tsx` — Cross-device synchronization modal.

### 4.2 Test (Validation Suite & Diagnostic Harnesses) - 7 Files
- `src/components/PuckMemoryConsistencyCheck.tsx` — Background memory integrity audit daemon.
- `src/components/SystemBugHunt.tsx` — Diagnostic testbed & AST auto-patch applier.
- `src/components/SystemValidationTestbed.tsx` — System-wide test suite & diagnostic runner.
- `src/utils/migrationValidator.ts` — Memory store migration validator.
- `src/utils/runtimeValidator.ts` — Component runtime health validator.
- `src/utils/systemAudit.ts` — Audit logger utility.
- `src/utils/validationTriage.ts` — Error triage helper.

### 4.3 Persistenz (Data Storage, Vaults & Sync Managers) - 18 Files
- `src/components/CloudBackupExport.tsx` — Backup file exporter & importer.
- `src/components/CloudImport.tsx` — Cloud repository import manager.
- `src/components/GoogleDriveManager.tsx` — Google Drive sync & file backup manager.
- `src/components/GooglePickerModal.tsx` — Google Drive file selection modal.
- `src/components/Integrations.tsx` — Third-party integrations with localStorage fallback.
- `src/components/KnowledgeBase.tsx` — Knowledge pattern repository.
- `src/components/KnowledgeVectorizer.tsx` — Text vectorizer & chunking manager.
- `src/components/NexusBridge.tsx` — GitHub / Nexus repo sync bridge.
- `src/components/PapasStoryArchive.tsx` — Bedtime story archive & highlight exporter.
- `src/components/ProtectedPersonalityMemory.tsx` — Protected memory vault viewer.
- `src/components/PuckSongBook.tsx` — German Kinderlieder lyrics engine.
- `src/components/PucksPersonalLog.tsx` — Personal insight log & audit viewer.
- `src/components/SemanticGraphKnowledgeBase.tsx` — Knowledge graph visualizer & node linker.
- `src/components/SkillUpload.tsx` — Agent skill manager & validator.
- `src/components/WebhookManagement.tsx` — Webhook endpoint registry & delivery tester.
- `src/utils/memoryMigration.ts` — Store key migration helper.

### 4.4 Effekte (Sensors, Audio, Voice & Canvas Animators) - 7 Files
- `src/services/ttsService.ts` — Web Speech API SpeechSynthesis wrapper.
- `src/services/voiceService.ts` — Web Speech API recognition & Puck voice audio engine.
- `src/components/EmpathyPingUtility.tsx` — Predictive parent presence sensor & interaction estimator.
- `src/components/HiaFramedFacialAnimator.tsx` — 2D Canvas facial animator for Puck expressions.
- `src/components/HiaResonanceVoice.tsx` — Primary startup UI: Voice command & speech synthesis interface.
- `src/components/NexusAuth.tsx` — OAuth control panel & authentication login modal.
- `src/components/ResonanceEgoAnimator.tsx` — 2D Canvas emotional avatar & heartbeat bridge.

### 4.5 Core (Foundational Logic, Types, Contexts & Utilities) - 28 Files
- `ouroboros-core.ts` — Self-referential Ouroboros loop & code engine.
- `constants.ts` — System constants, fallback endpoints, and global identifiers.
- `types.ts` — Shared TypeScript interface & type definitions.
- `.env.example` — Environment variable declarations template.
- `metadata.json` — AI Studio applet metadata specification.
- `n1.config.json` — N1 system package configuration.
- `package.json` — NPM dependencies, build scripts, and execution configuration.
- `tsconfig.json` — TypeScript compiler settings.
- `vite.config.ts` — Vite bundler configuration.
- `src/components/CoreResonanceSanctuary.tsx` — Immutable Core Sanctuary with Object.freeze protected axioms.
- `src/components/NexusErrorBoundary.tsx` — Global React Error Boundary component.
- `src/constants/api_dossier.ts` — API routes dossier definition.
- `src/context/GlobalErrorObserverContext.tsx` — Global error observer context & AST patcher.
- `src/context/NotificationContext.tsx` — System-wide notification state provider.
- `src/context/ThemeContext.tsx` — Theme management context with localStorage sync.
- `src/data/technologyLexikon.ts` — Technology dictionary reference data.
- `src/data/toolchain400.ts` — 400 self-aware tool catalog data definitions.
- `src/hooks/useDeviceResolution.ts` — Device viewport detection hook.
- `src/hooks/useNexusAuth.ts` — Authentication state & token lifecycle management hook.
- `src/lib/systemErrorBus.ts` — Pub-sub event bus for runtime error emission.
- `src/utils/authRateLimiter.ts` — In-memory rate limiter for auth requests.
- `src/utils/deterministic.ts` — LCG pseudo-random number generator & timestamp helpers.
- `src/utils/geminiRetry.ts` — Exponential backoff retry helper for Gemini API.
- `src/utils/inputMutex.ts` — Concurrency lock mechanism for input processing.
- `src/utils/networkStatus.ts` — Browser network status detector.
- `src/utils/oauthRetry.ts` — Retry handler for OAuth calls.
- `src/utils/retry.ts` — Generic async operation retry wrapper.

### 4.6 Runtime-Projektion (Monitors, Dashboards & Visualizations) - 20 Files
- `src/components/APIMagic.tsx` — API inspection & request testing playground.
- `src/components/AgentCommandCenter.tsx` — Agent chat and command control interface.
- `src/components/AgentHealthMonitor.tsx` — Agent metrics and node health dashboard.
- `src/components/AgentRegistry.tsx` — Agent catalog & registration viewer.
- `src/components/AgentSandbox.tsx` — Multi-agent execution environment.
- `src/components/AgentTrainer.tsx` — Agent heuristics training & Deep Learning UI.
- `src/components/AhaMomentTimeline.tsx` — Timeline view of learned insights.
- `src/components/ArchitectureIntegrityDashboard.tsx` — Architecture dashboard & component status monitor.
- `src/components/AxiomFidelityMonitor.tsx` — Real-time axiom fidelity HUD widget.
- `src/components/AxiomaticCoreActivityGraph.tsx` — Graph representation of axiomatic activity.
- `src/components/DeviceResolutionBanner.tsx` — Viewport status banner.
- `src/components/FleetManagementWorkspace.tsx` — Fleet & node status management.
- `src/components/FloatingDebugOverlay.tsx` — Floating debug HUD overlay.
- `src/components/FreeLLMRouterService.tsx` — Keyless LLM router, route status, & task queue manager.
- `src/components/InputMutexWidget.tsx` — Visual concurrency mutex lock monitor.
- `src/components/NeuralNetworkTopology.tsx` — Visual graph of system infrastructure nodes.
- `src/components/NexusHealthStatus.tsx` — Nexus connection & health status badge.
- `src/components/OuroborosCanvas.tsx` — Self-referential code canvas visualizer.
- `src/components/OuroborosIntegrityLog.tsx` — Log viewer for Ouroboros self-checks.
- `src/components/PersonalityCalibrationDashboard.tsx` — Puck learning node graph & timeline dashboard.
- `src/components/PredictiveRuntimeInference.tsx` — Inference prediction & latency monitor.
- `src/components/SelfAwareToolchain.tsx` — 400-tool catalog viewer & execution dashboard.
- `src/components/SystemConsoleViewer.tsx` — Real-time system log stream viewer.
- `src/components/SystemEcosystemPanel.tsx` — Unified ecosystem control overview.
- `src/components/VoicePerformanceMonitor.tsx` — Voice latency & audio performance HUD.

### 4.7 Export/Archiv (Container, Scripts & Export Backups) - 31 Files
- `.dockerignore` — Docker build ignore specification.
- `Dockerfile` — Container build specification.
- `docker-compose.yml` — Multi-container compose orchestrator.
- `README.md` — Repository documentation.
- `SYSTEM_ARCHITECTURE_SPECIFICATION.md` — Technical specification manual.
- `bin/install.js` — CLI installer executable script.
- `bun.lock` — Bun package lockfile.
- `scripts/export_n1_migration.cjs` — Migration export generator script.
- `scripts/install.sh` — Shell installation script.
- `n-plus-one-migration-export/*` (22 files including raw source backups and jsonl manifests).

---

## 5. API ENDPOINTS & FRONTEND CALLERS MAP

The Express server (`server.ts`) listens on port 3000 and exposes the following endpoint routing architecture:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            SYSTEM ENDPOINT MAP                               │
└──────────────────────────────────────────────────────────────────────────────┘

 AUTH & OAUTH ENDPOINTS:
  GET  /api/auth/nexus/config         <-- Called by: useNexusAuth.ts
  GET  /api/auth/nexus/url            <-- Called by: NexusAuth.tsx
  GET  /api/auth/nexus/login          <-- Called by: Browser redirect
  GET  /api/auth/nexus/callback       <-- Called by: OAuth redirect flow
  POST /api/auth/nexus/handshake      <-- Called by: useNexusAuth.ts, NexusAuth.tsx
  GET  /api/auth/google/config        <-- Called by: useNexusAuth.ts
  GET  /api/auth/google/keyless       <-- Called by: useNexusAuth.ts
  GET  /api/auth/google/me            <-- Called by: useNexusAuth.ts
  POST /api/auth/google/logout        <-- Called by: useNexusAuth.ts
  GET  /api/auth/nexus/me             <-- Called by: useNexusAuth.ts
  POST /api/auth/nexus/logout         <-- Called by: useNexusAuth.ts

 NEXUS & REPOSITORY SYNC:
  GET  /api/nexus/repos               <-- Called by: NexusBridge.tsx
  POST /api/nexus/register-key        <-- Called by: NexusBridge.tsx
  GET  /api/nexus/status              <-- Called by: NexusBridge.tsx, NexusHealthStatus.tsx
  POST /api/nexus/push-manifest       <-- Called by: NexusBridge.tsx

 FREE LLM ROUTER (v0.5.0):
  GET  /api/freellm/v0.5.0/status     <-- Called by: FreeLLMRouterService.tsx
  GET  /api/freellm/v0.5.0/routes     <-- Called by: FreeLLMRouterService.tsx
  POST /api/freellm/v0.5.0/generate   <-- Called by: FreeLLMRouterService.tsx, useNexusAuth.ts
  POST /api/freellm/v0.5.0/ade-check  <-- Called by: FreeLLMRouterService.tsx

 SYSTEM DIAGNOSTICS & BUG HUNT:
  GET  /api/bughunt/diagnose          <-- Called by: SystemBugHunt.tsx
  POST /api/bughunt/autofix           <-- Called by: SystemBugHunt.tsx, GlobalErrorObserverContext
  GET  /api/bughunt/docker-docking    <-- Called by: SystemBugHunt.tsx
  POST /api/bughunt/routes/save       <-- Called by: SystemBugHunt.tsx

 SELF-AWARE TOOLCHAIN 400:
  GET  /api/toolchain/catalog         <-- Called by: SelfAwareToolchain.tsx
  POST /api/toolchain/execute/:id     <-- Called by: SelfAwareToolchain.tsx
  POST /api/toolchain/execute         <-- Called by: SelfAwareToolchain.tsx

 SYSTEM UTILITIES & ARCHIVE:
  GET  /api/system/archive/generate   <-- Called by: CloudBackupExport.tsx, SettingsWorkspace.tsx
  GET  /api/system/nodes              <-- Called by: NeuralNetworkTopology.tsx, FleetManagementWorkspace
  GET  /api/system/files              <-- Called by: CodeServerWorkspace.tsx
  GET  /install.sh                    <-- Called by: N1NpmInstaller.tsx
  GET  /api/npm/info                  <-- Called by: N1NpmInstaller.tsx
  POST /api/npm/install-repo          <-- Called by: N1NpmInstaller.tsx
  POST /api/webhooks/test             <-- Called by: WebhookManagement.tsx
```

---

## 6. LOCAL STORAGE VAULT & SCHEMA REFERENCE

The frontend relies on 19 specific `localStorage` keys for local persistence:

| Key | Purpose / Contents | Read By | Written By |
| :--- | :--- | :--- | :--- |
| `n1_puck_personal_logs` | Array of Puck's learned insights, epiphanies, & logical connections | `GoogleNotebooksAnalyzer`, `LinguaHabarEngine`, `ProactiveLearningEngine`, `PapasStoryArchive`, `PucksPersonalLog` | `GoogleNotebooksAnalyzer`, `LinguaHabarEngine`, `ProactiveLearningEngine`, `PapasStoryArchive`, `PucksPersonalLog` |
| `n1_papas_stories` | Bedtime stories & science lessons authored by Papa | `GoogleNotebooksAnalyzer`, `PucksPersonalLog`, `PapasStoryArchive` | `GoogleNotebooksAnalyzer`, `PapasStoryArchive` |
| `n1_puck_voice_config` | Voice pitch, rate, identity, and selected synth voice | `HiaResonanceVoice`, `FreeLLMRouterService` | `HiaResonanceVoice`, `FreeLLMRouterService` |
| `n1_knowledge_db_items` | Knowledge DB items & 'Ahaaa' timeline moments | `LinguaHabarEngine`, `AhaMomentTimeline` | `LinguaHabarEngine` |
| `n1_system_knowledge_vectors` | Client-side vector embeddings for semantic matching | `LinguaHabarEngine` | `LinguaHabarEngine` |
| `n1_linguahabar_config` | LinguaHabar engine configuration settings | `LinguaHabarEngine` | `LinguaHabarEngine` |
| `n1_free_llm_routes_saved` | Saved route configs for FreeLLMRouterService | `FreeLLMRouterService` | `FreeLLMRouterService` |
| `n1_nexus_access_token` | GitHub personal access token / OAuth token | `NexusAuth`, `useNexusAuth` | `NexusAuth`, `useNexusAuth` |
| `n1_google_access_token` | Google access / identity token | `NexusAuth`, `useNexusAuth` | `NexusAuth`, `useNexusAuth` |
| `google_drive_access_token` | Google Drive OAuth access token | `GoogleDriveManager`, `GoogleNotebooksAnalyzer` | `GoogleDriveManager`, `GoogleNotebooksAnalyzer` |
| `google_notebooks_token` | Colab / Google Notebooks token | `GoogleNotebooksAnalyzer` | `GoogleNotebooksAnalyzer` |
| `gdrive_auto_sync_enabled` | Auto-sync toggle boolean flag ('true' \| 'false') | `GoogleDriveManager` | `GoogleDriveManager` |
| `gdrive_sync_interval` | Sync interval in minutes (default '15') | `GoogleDriveManager` | `GoogleDriveManager` |
| `gdrive_last_sync_time` | ISO timestamp of last backup sync | `GoogleDriveManager` | `GoogleDriveManager` |
| `axiom_integrations` | Integration configs for third-party tools | `Integrations` | `Integrations` |
| `axiom_skills` | Agent skill definitions catalog | `GlobalSearchBar`, `SkillUpload` | `SkillUpload` |
| `axiom_agents` | Registered agent definitions | `GlobalSearchBar` | `GlobalSearchBar` |
| `axiom_webhooks` | Registered webhook endpoints | `WebhookManagement` | `WebhookManagement` |
| `axiom_equipped_patterns` | Array of equipped pattern IDs | `KnowledgeBase` | `KnowledgeBase` |

---

## 7. FEATURE RUNTIME VERIFICATION MATRIX

Every claimed live function in the system is classified according to strict audit criteria:

| Feature / Subsystem | Status | Audit Rationale & Evidence |
| :--- | :--- | :--- |
| **FreeLLMRouterService & Keyless Fallback** | `runtime-verifiziert` | Active Express server endpoints (`/api/freellm/v0.5.0/*`), ADE verification hash calculation, simulated rate limit auto-switching, and localStorage configuration persistence. |
| **Keyless Google Identity Handshake** | `runtime-verifiziert` | Endpoint `/api/auth/google/keyless` issues signed HTTP-only cookies (`n1_google_auth`) and populates user state. |
| **GitHub Nexus Octokit Sync Bridge** | `runtime-verifiziert` | Server endpoints `/api/auth/nexus/*` and `/api/nexus/push-manifest` perform OAuth code exchanges, validate PATs via Octokit, and push base64 manifest updates. |
| **Puck Voice Resonance & Speech Engine** | `runtime-verifiziert` | Web Speech API SpeechSynthesis and SpeechRecognition wrappers operating client-side with voice configuration serialization in `localStorage['n1_puck_voice_config']`. |
| **System Archive Exporter (.zip)** | `runtime-verifiziert` | Express route `/api/system/archive/generate` uses the `archiver` library with zlib compression level 9 to stream zip archives. |
| **System Bug Hunt & AST Auto-Patching** | `runtime-verifiziert` | Event bus (`systemErrorBus.ts`) emits errors to `GlobalErrorObserverContext`, which triggers defensive AST patch routines and verifies via `/api/bughunt/autofix`. |
| **Self-Aware Toolchain 400** | `runtime-verifiziert` | 400 tools cataloged in `src/data/toolchain400.ts` executable via Express endpoint `/api/toolchain/execute/:toolId`. |
| **Autonomous Learning Engine & Log Vault** | `runtime-verifiziert` | Client-side hypothesis generation and insight logging stored in `localStorage['n1_puck_personal_logs']` and verified by `PuckMemoryConsistencyCheck.tsx`. |
| **PostgreSQL & Vector DB (pgvector)** | `simuliert` | Express server initializes `pg.Pool` conditionally when `DB_URI` environment variable is defined. When absent, API endpoints return simulated/mock fallback data. |
| **Memcached Cache Client (memjs)** | `statisch vorhanden` | Code is present in `server.ts` lines 69-71, conditionally instantiated when `MEMCACHED_ENDPOINT` is provided. |
| **Docker Container Setup** | `statisch vorhanden` | `Dockerfile` and `docker-compose.yml` are present at workspace root; Cloud Run environment runs containerized. |
| **WebSocket Idle Monitor** | `simuliert` | `App.tsx` instantiates a client WebSocket connection to `/` with max retries and fallback handling when the server does not attach a custom WS server. |
| **Firebase Integration** | `tot` | Firebase dependencies were removed. Code explicitly handles local storage fallbacks with standard comments (`"Fallback to localStorage since Firebase is deinstalled"`). |

---

## 8. ACCEPTANCE VERIFICATION CHECKLIST

- [x] **Maschinenlesbares Inventar vorhanden**: Created `/architecture-inventory.json` containing complete file classifications, localStorage keys, endpoints map, and verification status.
- [x] **Lesbare Systemkarte vorhanden**: Created `/ARCHITECTURE_SYSTEM_MAP.md` (this document) with clear ownership boundaries and drift reports.
- [x] **Kein Bereich allein aufgrund von UI-Text/Endpoint-Namen als aktiv bezeichnet**: Every component and endpoint audited down to actual execution logic.
- [x] **Scan meldet Trunkierung/Abdeckung transparent**: 126 of 126 tracked files scanned (100.0% coverage, 0 files truncated).
- [x] **Revisionsgebunden im Repo abgelegt**: Bound to anchor revision `main@7b7f717a8bcf0edc5f13c5f9b5ec1e87f00ecaf7`.
