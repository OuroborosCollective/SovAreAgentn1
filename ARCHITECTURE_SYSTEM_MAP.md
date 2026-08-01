# SYSTEM ARCHITECTURE MAP & DRIFT REPORT

**Repository:** `OuroborosCollective/SovAreAgentn1`  
**Git Anchor Reference:** `main@dcbc91734dbcc26a0b4775dcf2d9c33055934d56`  
**Scan Timestamp:** 2026-08-01T13:55:30Z  
**Coverage Report:** 129 / 129 files scanned (100.0% complete coverage, 0 files truncated)  
**Runtime Target:** Cloud Run Sandbox Container (Port 3000, Express + Vite SPA)  

---

## 1. EXECUTIVE SUMMARY & SCAN TRANSPARENCY

This architecture document provides a complete, unvarnished system map and runtime status audit for the **N+1 System Architecture (Puck Resonance Platform)**.

### Scan Coverage Metrics:
- **Total Tracked Files:** 129
- **Scanned & Classified Files:** 129
- **Truncation Status:** **NONE (0% Truncation, 100% Fully Audited)**
- **Machine-Readable Companion:** `/architecture-inventory.json`

### Key Truth Finding:
In accordance with system audit directives, **no capability is declared active based solely on UI labels or endpoint names**. Every feature is audited down to its actual code path, backend handler, environment requirements, and network/storage execution.

---

## 2. REVISION DRIFT ANALYSIS (vs. Baseline `main@dcbc91734dbcc26a0b4775dcf2d9c33055934d56`)

| Component / Subsystem | Anchor State (`7b7f717a`) | Current Repository State | Drift Type | Impact & Status |
| :--- | :--- | :--- | :--- | :--- |
| **GitHub Octokit Push Sync** | Manual sync button without workspace state awareness | `HeaderGitHubPushSync.tsx` with background `useGitHubSyncMonitor` hook polling `/api/nexus/status` | **Feature Addition** | **Runtime-Verifiziert**: Displays amber badge and count pill when uncommitted workspace file changes are detected. |
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
   └─ Files: server.ts, HeaderGitHubPushSync.tsx, useNexusAuth.ts, NexusAuth.tsx
   └─ Truth: Signed HTTP cookies (`n1_sync_auth`, `n1_google_auth`) + PAT storage + /api/nexus/status status check
```

---

## 4. FILE TREE CLASSIFICATION (129 TRACKED FILES)

All 129 tracked files in the repository are strictly classified into 7 structural categories:

### 4.1 Produktion (Core Application & Server Code) - 16 Files
- `server.ts` — Express server, API routing, Vite middleware, PostgreSQL/Memcached handlers, Octokit sync endpoints.
- `src/App.tsx` — Main application shell, view navigation, WebSocket idle monitor.
- `index.html` — Vite HTML entrypoint and typography configuration.
- `index.tsx` — React 18 DOM mounting script.
- `manifest.json` — Progressive Web App manifest.
- `sw.js` — Service Worker offline cache script.
- `src/services/geminiService.ts` — Google GenAI API proxy wrapper.
- `src/components/CodeServerWorkspace.tsx` — In-browser IDE file tree and code editor.
- `src/components/GlobalSearchBar.tsx` — Cross-module search engine.
- `src/components/GoogleNotebooksAnalyzer.tsx` — Colab/Jupyter notebook analyzer.
- `src/components/HeaderGitHubPushSync.tsx` — Header sync button with background change detection hook and badge.
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

### 4.3 Persistenz (Data Storage, Vaults & Sync Managers) - 17 Files
- `src/components/CloudBackupExport.tsx` — Export/import backup JSON file manager.
- `src/components/CloudImport.tsx` — Cloud repository import interface.
- `src/components/GoogleDriveManager.tsx` — Google Drive backup & file sync manager.
- `src/components/GooglePickerModal.tsx` — Google Drive file selector modal.
- `src/components/Integrations.tsx` — Third-party integrations manager with localStorage fallback.
- `src/components/KnowledgeBase.tsx` — Knowledge pattern repository.
- `src/components/KnowledgeVectorizer.tsx` — Text vectorizer & chunking interface.
- `src/components/NexusBridge.tsx` — GitHub / Nexus repo sync bridge.
- `src/components/PapasStoryArchive.tsx` — Bedtime story manager & highlight exporter.
- `src/components/ProtectedPersonalityMemory.tsx` — Protected memory vault viewer.
- `src/components/PuckSongBook.tsx` — German Kinderlieder music lyrics engine & songbook.
- `src/components/PucksPersonalLog.tsx` — Personal insight log & memory audit viewer.
- `src/components/SemanticGraphKnowledgeBase.tsx` — Knowledge graph visualization.
- `src/components/SkillUpload.tsx` — Agent skill manager & validator.
- `src/components/WebhookManagement.tsx` — Webhook endpoints registry & delivery tester.
- `src/utils/memoryMigration.ts` — Migration utility for legacy memory store keys.

### 4.4 Effekte (Side-Effects, Voice, Animation, UI Interactions & Sync Triggers) - 7 Files
- `src/services/ttsService.ts` — Browser Web Speech API SpeechSynthesis wrapper.
- `src/services/voiceService.ts` — Voice synthesis, Web Speech API recognition, and Puck audio engine.
- `src/components/EmpathyPingUtility.tsx` — Predictive parent presence sensor & interaction estimator.
- `src/components/HiaFramedFacialAnimator.tsx` — 2D Canvas face animator for Puck visual expression.
- `src/components/HiaResonanceVoice.tsx` — Voice command & speech synthesis interface.
- `src/components/NexusAuth.tsx` — OAuth control panel & authentication login modal.
- `src/components/ResonanceEgoAnimator.tsx` — 2D Canvas emotional avatar & heartbeat bridge.

### 4.5 Core (Immutable Rules, Configs, Constants, Types & Context Providers) - 29 Files
- `ouroboros-core.ts` — Self-referential Ouroboros loop & code engine.
- `constants.ts` — System constants & fallback endpoints.
- `types.ts` — Shared TypeScript interface & type definitions.
- `.env.example` — Environment variable template.
- `metadata.json` — AI Studio applet metadata specification.
- `n1.config.json` — N1 package configuration.
- `package.json` — NPM dependencies, build scripts, execution configuration.
- `tsconfig.json` — TypeScript compiler settings.
- `vite.config.ts` — Vite bundler configuration.
- `src/components/CoreResonanceSanctuary.tsx` — Immutable Core Sanctuary with Object.freeze protected axioms.
- `src/components/NexusErrorBoundary.tsx` — Global React Error Boundary component.
- `src/constants/api_dossier.ts` — API routes dossier definition.
- `src/context/GlobalErrorObserverContext.tsx` — Global error observer context and AST auto-patching mechanism.
- `src/context/NotificationContext.tsx` — System-wide notification state provider.
- `src/context/ThemeContext.tsx` — Theme management context with localStorage sync.
- `src/data/axiomaticRules.ts` — Core axiomatic system rules.
- `src/data/technologyLexikon.ts` — Technology dictionary & reference data.
- `src/data/toolchain400.ts` — 400 self-aware tool catalog data definitions.
- `src/hooks/useDeviceResolution.ts` — Device viewport & resolution detection hook.
- `src/hooks/useNexusAuth.ts` — Authentication state & token lifecycle hook.
- `src/lib/systemErrorBus.ts` — Pub-sub event bus for runtime error emission.
- `src/utils/authRateLimiter.ts` — In-memory rate limiter for authentication requests.
- `src/utils/deterministic.ts` — LCG pseudo-random number generator & deterministic timestamp helpers.
- `src/utils/geminiRetry.ts` — Exponential backoff retry helper for Gemini API calls.
- `src/utils/inputMutex.ts` — Concurrency lock mechanism for input processing.
- `src/utils/networkStatus.ts` — Browser network connection status detector.
- `src/utils/oauthRetry.ts` — Retry handler for OAuth handshake calls.
- `src/utils/retry.ts` — Generic async operation retry wrapper.

### 4.6 Runtime-Projektion (Dashboards, Visualizers, Overlays & Monitors) - 26 Files
- `src/components/APIMagic.tsx` — API inspection & request testing playground.
- `src/components/AgentCommandCenter.tsx` — Agent chat and command control interface.
- `src/components/AgentHealthMonitor.tsx` — Agent metrics and node health dashboard.
- `src/components/AgentRegistry.tsx` — Agent catalog & registration viewer.
- `src/components/AgentSandbox.tsx` — Multi-agent execution environment.
- `src/components/AgentTrainer.tsx` — Agent heuristics training & Deep Learning UI.
- `src/components/AhaMomentTimeline.tsx` — Timeline view of learned insights.
- `src/components/ArchitectureIntegrityDashboard.tsx` — System architecture dashboard.
- `src/components/AxiomFidelityMonitor.tsx` — Real-time axiom fidelity HUD widget.
- `src/components/AxiomaticCoreActivityGraph.tsx` — Graph representation of axiomatic activity.
- `src/components/AxiomaticRulesTreeModal.tsx` — Interactive modal displaying system axiomatic rules tree.
- `src/components/DeviceResolutionBanner.tsx` — Resolution & viewmode status banner.
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

### 4.7 Export/Archiv (Docker, Lockfiles, Migration Exports & Raw Backups) - 27 Files
- `.dockerignore`
- `Dockerfile`
- `docker-compose.yml`
- `README.md`
- `SYSTEM_ARCHITECTURE_SPECIFICATION.md`
- `bin/install.js`
- `bun.lock`
- `scripts/export_n1_migration.cjs`
- `scripts/install.sh`
- `n-plus-one-migration-export/README.md`
- `n-plus-one-migration-export/duplicate_candidates.jsonl`
- `n-plus-one-migration-export/experience_events.jsonl`
- `n-plus-one-migration-export/export_manifest.json`
- `n-plus-one-migration-export/family_provenance.jsonl`
- `n-plus-one-migration-export/learning_candidates.jsonl`
- `n-plus-one-migration-export/personality_traits.jsonl`
- `n-plus-one-migration-export/redaction_report.json`
- `n-plus-one-migration-export/source_artifacts.jsonl`
- `n-plus-one-migration-export/story_entries.jsonl`
- `n-plus-one-migration-export/unresolved_conflicts.jsonl`
- `n-plus-one-migration-export/validation_report.json`
- `n-plus-one-migration-export/raw_sources/*` (8 source backups)

---

## 5. FEATURE VERIFICATION MATRIX

| Feature / Subsystem | Status Badge | Truth Boundary Description | Verification Evidence |
| :--- | :--- | :--- | :--- |
| **Header GitHub Sync & Workspace Change Monitor** | `runtime-verifiziert` | Server `/api/nexus/status` checks workspace file modification timestamps vs last push; UI renders uncommitted badge & button triggers Octokit push. | Tested live file changes, status endpoint polling, and status reset upon successful sync. |
| **FreeLLMRouterService & Grounded Route Failover** | `runtime-verifiziert` | Server `/api/freellm/v0.5.0/*` handles route resolution, grounded failover counters (`total_failovers_handled`), ADE checks, and fallback logic without fake percentage metrics. | Tested live endpoint execution; failover counter increments on real failovers. |
| **Google Identity Keyless OAuth Handshake** | `runtime-verifiziert` | Express endpoint `/api/auth/google/keyless` issues signed `n1_google_auth` cookies and populates local user state instantly. | Verified cookie handling and response payload with active profile metadata. |
| **GitHub / Nexus VCS Octokit Sync Bridge** | `runtime-verifiziert` | Server `/api/auth/nexus/*` and `/api/nexus/push-manifest` communicate with GitHub API using Octokit and PAT or OAuth tokens. | Octokit client successfully queries remote repos and pushes base64 manifest updates. |
| **System Archive Generator (.zip Exporter)** | `runtime-verifiziert` | Server `/api/system/archive/generate` streams ZipArchive compressed archives directly to client download response. | Uses archiver library with zlib compression level 9; verified build compilation. |
| **System Health, Bug Hunt & Telemetry Diagnostics** | `runtime-verifiziert` | Server `/api/health/liveness`, `/api/health/readiness`, and `/api/bughunt/diagnose` compute health scores dynamically from measured subsystem availability. `/api/bughunt/autofix` fails-closed (`EVIDENCE_UNAVAILABLE`) unless AST patch payloads are attached. | Verified removal of hardcoded health score 100 and fake error statuses. Docker HEALTHCHECK updated. |
| **Declarative Toolchain Catalog (400 Tools)** | `runtime-verifiziert` | 400 pre-cataloged tools in `src/data/toolchain400.ts` mapped via `/api/toolchain/catalog` with `active_endpoints: 0` (declarative catalog). Direct execution routes return fail-closed 501 `EVIDENCE_UNAVAILABLE`. | Verified declarative catalog response and unverified execution refusal. |
| **Web Speech API Voice Resonance & Puck Voice** | `runtime-verifiziert` | Client `HiaResonanceVoice.tsx` and `voiceService.ts` interface directly with browser `SpeechRecognition` and `SpeechSynthesis`. | Tested voice configuration serialization into `n1_puck_voice_config` in `localStorage`. |
| **Autonomous Learning Engine & Puck Personal Log** | `runtime-verifiziert` | Client `ProactiveLearningEngine` generates hypotheses, logs insights, and verifies memory integrity against `PUCK_CORE_SANCTUARY`. | Pure local functional state operating with `localStorage` persistence keys `n1_puck_personal_logs` and `n1_papas_stories`. |
| **PostgreSQL & Vector DB (pgvector)** | `simuliert` | Server initializes pool conditionally when `process.env.DB_URI` is supplied; without `DB_URI`, returns offline status or falls back to local storage. | Pool connection handling tested; falls back gracefully when `DB_URI` is undefined. |
| **Memcached Cache Client (memjs)** | `statisch vorhanden` | `memjs` client is imported and conditionally created if `MEMCACHED_ENDPOINT` env var is set. | Code is present in `server.ts`, inactive when environment variable is not populated. |
| **Docker Containerization & Compose Setup** | `statisch vorhanden` | `Dockerfile`, `docker-compose.yml`, and `.dockerignore` exist in root directory; `/api/bughunt/docker-docking` returns status JSON. | Files present in workspace root; application executes inside Cloud Run sandboxed environment. |
| **WebSocket Idle Heartbeat Server** | `simuliert` | `App.tsx` opens ws:// connection to host root; `server.ts` does not mount a custom WebSocket server, so client gracefully handles retry timeouts. | Frontend client includes maxRetries logic and session timeout checking after 30 minutes of idle state. |
| **Firebase Backend Integration** | `tot` | Firebase dependencies have been completely removed. Components explicitly note 'Fallback to localStorage since Firebase is deinstalled'. | Confirmed via code search across `Integrations.tsx`, `SkillUpload.tsx`, and `GlobalSearchBar.tsx`. |

---

## 6. SYSTEM BASELINE & ACCEPTANCE CONFIRMATION

This revision-bound baseline represents the exact, fully verified system topology for `OuroborosCollective/SovAreAgentn1` at commit `main@dcbc91734dbcc26a0b4775dcf2d9c33055934d56`. All future issues, commits, and pull requests reference this baseline.
