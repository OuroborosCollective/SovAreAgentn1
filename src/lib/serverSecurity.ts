import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export type RoleLevel = "public" | "family" | "owner-admin" | "internal-service" | "disabled";
export type EffectType = "READ" | "MUTATING" | "SYSTEM_CHANGE" | "AUTH_HANDSHAKE";
export type DataClassification = "PUBLIC" | "INTERNAL" | "RESTRICTED" | "CONFIDENTIAL";

export interface EndpointPolicy {
  pathPattern: string;
  methods: string[];
  role: RoleLevel;
  effect: EffectType;
  dataClassification: DataClassification;
  rateLimitPerMin: number;
  description: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: RoleLevel;
  method: string;
  path: string;
  effect: EffectType;
  status: "SUCCESS" | "DENIED" | "ERROR";
  statusCode: number;
  ip: string;
  userAgent: string;
  revision: string;
  details?: string;
}

export const API_ENDPOINT_MATRIX: EndpointPolicy[] = [
  // Health Probes
  { pathPattern: "/api/health/liveness", methods: ["GET"], role: "public", effect: "READ", dataClassification: "PUBLIC", rateLimitPerMin: 120, description: "Liveness probe" },
  { pathPattern: "/api/health/readiness", methods: ["GET"], role: "public", effect: "READ", dataClassification: "PUBLIC", rateLimitPerMin: 120, description: "Readiness probe" },
  { pathPattern: "/api/health", methods: ["GET"], role: "public", effect: "READ", dataClassification: "PUBLIC", rateLimitPerMin: 120, description: "Health probe alias" },

  // Personality & Memory Routes
  { pathPattern: "/api/memory/events", methods: ["GET", "POST"], role: "family", effect: "MUTATING", dataClassification: "INTERNAL", rateLimitPerMin: 60, description: "Manage memory events" },
  { pathPattern: "/api/memory/migrate", methods: ["POST"], role: "family", effect: "MUTATING", dataClassification: "INTERNAL", rateLimitPerMin: 60, description: "Migrate memory events" },
  { pathPattern: "/api/personality/core", methods: ["GET"], role: "family", effect: "READ", dataClassification: "INTERNAL", rateLimitPerMin: 60, description: "Get core personality" },
  { pathPattern: "/api/personality/candidates", methods: ["GET", "POST"], role: "family", effect: "MUTATING", dataClassification: "INTERNAL", rateLimitPerMin: 60, description: "Manage learning candidates" },
  { pathPattern: "/api/personality/candidates/:id/resolve", methods: ["POST"], role: "family", effect: "MUTATING", dataClassification: "INTERNAL", rateLimitPerMin: 60, description: "Resolve candidate" },
  { pathPattern: "/api/privacy/consent", methods: ["GET", "POST"], role: "family", effect: "MUTATING", dataClassification: "INTERNAL", rateLimitPerMin: 60, description: "Manage privacy consent" },
  { pathPattern: "/api/privacy/forget", methods: ["POST"], role: "family", effect: "MUTATING", dataClassification: "INTERNAL", rateLimitPerMin: 60, description: "Forget private data" },
  { pathPattern: "/api/backup/export", methods: ["GET"], role: "family", effect: "READ", dataClassification: "INTERNAL", rateLimitPerMin: 10, description: "Export backup manifest" },
  { pathPattern: "/api/backup/restore", methods: ["POST"], role: "family", effect: "MUTATING", dataClassification: "INTERNAL", rateLimitPerMin: 10, description: "Restore backup manifest" },

  // Public Auth Routes
  { pathPattern: "/api/auth/nexus/config", methods: ["GET"], role: "public", effect: "READ", dataClassification: "PUBLIC", rateLimitPerMin: 60, description: "Nexus config" },
  { pathPattern: "/api/auth/nexus/url", methods: ["GET"], role: "public", effect: "READ", dataClassification: "PUBLIC", rateLimitPerMin: 60, description: "Nexus OAuth URL" },
  { pathPattern: "/api/auth/nexus/login", methods: ["GET"], role: "public", effect: "AUTH_HANDSHAKE", dataClassification: "PUBLIC", rateLimitPerMin: 30, description: "Nexus login" },
  { pathPattern: "/api/auth/nexus/callback", methods: ["GET"], role: "public", effect: "AUTH_HANDSHAKE", dataClassification: "PUBLIC", rateLimitPerMin: 30, description: "Nexus callback" },
  { pathPattern: "/api/auth/nexus/handshake", methods: ["POST"], role: "public", effect: "AUTH_HANDSHAKE", dataClassification: "PUBLIC", rateLimitPerMin: 30, description: "Nexus handshake" },
  { pathPattern: "/api/auth/nexus/me", methods: ["GET"], role: "public", effect: "READ", dataClassification: "PUBLIC", rateLimitPerMin: 60, description: "Nexus me check" },
  { pathPattern: "/api/auth/nexus/logout", methods: ["POST"], role: "public", effect: "AUTH_HANDSHAKE", dataClassification: "PUBLIC", rateLimitPerMin: 30, description: "Nexus logout" },
  { pathPattern: "/api/auth/github/me", methods: ["GET"], role: "public", effect: "READ", dataClassification: "PUBLIC", rateLimitPerMin: 60, description: "GitHub me alias" },
  { pathPattern: "/api/auth/google/config", methods: ["GET"], role: "public", effect: "READ", dataClassification: "PUBLIC", rateLimitPerMin: 60, description: "Google config" },
  { pathPattern: "/api/auth/google/keyless", methods: ["GET"], role: "public", effect: "AUTH_HANDSHAKE", dataClassification: "PUBLIC", rateLimitPerMin: 30, description: "Google keyless auth" },
  { pathPattern: "/api/auth/google/me", methods: ["GET"], role: "public", effect: "READ", dataClassification: "PUBLIC", rateLimitPerMin: 60, description: "Google me check" },
  { pathPattern: "/api/auth/google/logout", methods: ["POST"], role: "public", effect: "AUTH_HANDSHAKE", dataClassification: "PUBLIC", rateLimitPerMin: 30, description: "Google logout" },

  // Public - Voice Dialogue Contract & TTS
  { pathPattern: "/api/agent-command/chat", methods: ["POST"], role: "public", effect: "READ", dataClassification: "PUBLIC", rateLimitPerMin: 60, description: "Public Voice Agent conversational dialogue contract" },
  { pathPattern: "/api/tts", methods: ["POST"], role: "public", effect: "READ", dataClassification: "PUBLIC", rateLimitPerMin: 120, description: "Text To Speech voice synthesis API" },
  { pathPattern: "/api/push/stream", methods: ["GET"], role: "public", effect: "READ", dataClassification: "PUBLIC", rateLimitPerMin: 120, description: "Push SSE stream endpoint" },
  { pathPattern: "/api/push/send", methods: ["POST"], role: "public", effect: "MUTATING", dataClassification: "PUBLIC", rateLimitPerMin: 120, description: "Push notification broadcast endpoint" },
  { pathPattern: "/api/wolfram/solve", methods: ["POST"], role: "public", effect: "READ", dataClassification: "PUBLIC", rateLimitPerMin: 120, description: "Wolfram research sandbox execution" },
  { pathPattern: "/api/github/continuous-ai/issues", methods: ["GET"], role: "public", effect: "READ", dataClassification: "PUBLIC", rateLimitPerMin: 120, description: "GitHub continuous AI issues probe" },

  // Public - CLI / Info
  { pathPattern: "/install.sh", methods: ["GET"], role: "public", effect: "READ", dataClassification: "PUBLIC", rateLimitPerMin: 60, description: "Installer script" },
  { pathPattern: "/api/npm/info", methods: ["GET"], role: "public", effect: "READ", dataClassification: "PUBLIC", rateLimitPerMin: 60, description: "NPM info" },

  // Family Role Routes
  { pathPattern: "/api/nexus/repos", methods: ["GET"], role: "family", effect: "READ", dataClassification: "INTERNAL", rateLimitPerMin: 60, description: "Repos list" },
  { pathPattern: "/api/nexus/status", methods: ["GET"], role: "family", effect: "READ", dataClassification: "INTERNAL", rateLimitPerMin: 60, description: "Sync status" },
  { pathPattern: "/api/system/nodes", methods: ["GET"], role: "family", effect: "READ", dataClassification: "INTERNAL", rateLimitPerMin: 60, description: "Nodes topology" },
  { pathPattern: "/api/system/files", methods: ["GET"], role: "family", effect: "READ", dataClassification: "INTERNAL", rateLimitPerMin: 60, description: "Files tree" },
  { pathPattern: "/api/vectors/upsert", methods: ["POST"], role: "family", effect: "MUTATING", dataClassification: "INTERNAL", rateLimitPerMin: 30, description: "Vector upsert" },
  { pathPattern: "/api/vectors/search", methods: ["POST"], role: "family", effect: "READ", dataClassification: "INTERNAL", rateLimitPerMin: 60, description: "Vector search" },
  { pathPattern: "/api/vector/reflect-canvas", methods: ["POST"], role: "family", effect: "READ", dataClassification: "INTERNAL", rateLimitPerMin: 60, description: "Vector reflect canvas" },
  { pathPattern: "/api/db/status", methods: ["GET"], role: "family", effect: "READ", dataClassification: "INTERNAL", rateLimitPerMin: 60, description: "DB status" },
  { pathPattern: "/api/db/query", methods: ["POST"], role: "owner-admin", effect: "READ", dataClassification: "CONFIDENTIAL", rateLimitPerMin: 30, description: "Allowlisted DB diagnostic query" },
  { pathPattern: "/api/partners/connections", methods: ["GET", "POST", "DELETE"], role: "family", effect: "MUTATING", dataClassification: "INTERNAL", rateLimitPerMin: 30, description: "Partner connections" },
  { pathPattern: "/api/partners/connect", methods: ["POST"], role: "family", effect: "MUTATING", dataClassification: "INTERNAL", rateLimitPerMin: 30, description: "Partner connect" },
  { pathPattern: "/api/integration/connect", methods: ["POST"], role: "family", effect: "MUTATING", dataClassification: "INTERNAL", rateLimitPerMin: 30, description: "Integration connect" },
  { pathPattern: "/v1/responses", methods: ["POST"], role: "family", effect: "MUTATING", dataClassification: "INTERNAL", rateLimitPerMin: 60, description: "OpenAI completions" },
  { pathPattern: "/api/agents/handshake", methods: ["POST"], role: "family", effect: "AUTH_HANDSHAKE", dataClassification: "INTERNAL", rateLimitPerMin: 30, description: "Agent handshake" },
  { pathPattern: "/api/agents/train", methods: ["POST"], role: "family", effect: "MUTATING", dataClassification: "INTERNAL", rateLimitPerMin: 30, description: "Agent train" },
  { pathPattern: "/api/agents/integrate", methods: ["POST"], role: "family", effect: "MUTATING", dataClassification: "INTERNAL", rateLimitPerMin: 30, description: "Agent integrate" },
  { pathPattern: "/api/bughunt/docker-docking", methods: ["GET"], role: "family", effect: "READ", dataClassification: "INTERNAL", rateLimitPerMin: 60, description: "Bughunt docking" },
  { pathPattern: "/api/toolchain/catalog", methods: ["GET"], role: "family", effect: "READ", dataClassification: "INTERNAL", rateLimitPerMin: 60, description: "Toolchain catalog" },
  { pathPattern: "/api/toolchain/execute", methods: ["POST"], role: "family", effect: "MUTATING", dataClassification: "INTERNAL", rateLimitPerMin: 30, description: "Toolchain execute" },
  { pathPattern: "/api/migration/validate", methods: ["GET"], role: "family", effect: "READ", dataClassification: "INTERNAL", rateLimitPerMin: 60, description: "Migration validate" },
  { pathPattern: "/api/freellm/v0.5.0/status", methods: ["GET"], role: "family", effect: "READ", dataClassification: "INTERNAL", rateLimitPerMin: 60, description: "FreeLLM status" },
  { pathPattern: "/api/freellm/v0.5.0/routes", methods: ["GET"], role: "family", effect: "READ", dataClassification: "INTERNAL", rateLimitPerMin: 60, description: "FreeLLM routes" },
  { pathPattern: "/api/freellm/v0.5.0/generate", methods: ["POST"], role: "family", effect: "MUTATING", dataClassification: "INTERNAL", rateLimitPerMin: 30, description: "FreeLLM generate" },
  { pathPattern: "/api/freellm/v0.5.0/ade-check", methods: ["POST"], role: "family", effect: "READ", dataClassification: "INTERNAL", rateLimitPerMin: 60, description: "FreeLLM ADE check" },
  { pathPattern: "/api/npm/install-repo", methods: ["POST"], role: "family", effect: "MUTATING", dataClassification: "INTERNAL", rateLimitPerMin: 15, description: "NPM install" },
  { pathPattern: "/api/webhooks/test", methods: ["POST"], role: "family", effect: "MUTATING", dataClassification: "INTERNAL", rateLimitPerMin: 30, description: "Webhook test" },

  // Owner-Admin Privilege Operations
  { pathPattern: "/api/nexus/push-manifest", methods: ["POST"], role: "owner-admin", effect: "SYSTEM_CHANGE", dataClassification: "RESTRICTED", rateLimitPerMin: 15, description: "GitHub push sync" },
  { pathPattern: "/api/nexus/mirror-sync", methods: ["POST"], role: "owner-admin", effect: "SYSTEM_CHANGE", dataClassification: "RESTRICTED", rateLimitPerMin: 15, description: "Automatic GitHub mirror sync" },
  { pathPattern: "/api/nexus/pull", methods: ["POST"], role: "owner-admin", effect: "SYSTEM_CHANGE", dataClassification: "RESTRICTED", rateLimitPerMin: 15, description: "Pull remote repository changes" },
  { pathPattern: "/api/nexus/conflicts/resolve", methods: ["POST"], role: "owner-admin", effect: "SYSTEM_CHANGE", dataClassification: "RESTRICTED", rateLimitPerMin: 15, description: "Resolve git merge conflicts" },
  { pathPattern: "/api/nexus/register-key", methods: ["POST"], role: "owner-admin", effect: "SYSTEM_CHANGE", dataClassification: "RESTRICTED", rateLimitPerMin: 15, description: "Register SSH key" },
  { pathPattern: "/api/system/archive/generate", methods: ["GET"], role: "owner-admin", effect: "SYSTEM_CHANGE", dataClassification: "RESTRICTED", rateLimitPerMin: 10, description: "Generate workspace ZIP" },
  { pathPattern: "/api/bughunt/diagnose", methods: ["GET"], role: "owner-admin", effect: "READ", dataClassification: "RESTRICTED", rateLimitPerMin: 30, description: "Bughunt deep diagnose" },
  { pathPattern: "/api/bughunt/autofix", methods: ["POST"], role: "owner-admin", effect: "SYSTEM_CHANGE", dataClassification: "RESTRICTED", rateLimitPerMin: 15, description: "AST autofix execution" },
  { pathPattern: "/api/bughunt/routes/save", methods: ["POST"], role: "owner-admin", effect: "SYSTEM_CHANGE", dataClassification: "RESTRICTED", rateLimitPerMin: 15, description: "Save system routes" },
  { pathPattern: "/api/toolchain/execute/", methods: ["POST"], role: "owner-admin", effect: "SYSTEM_CHANGE", dataClassification: "RESTRICTED", rateLimitPerMin: 15, description: "Privileged toolchain execution" },
  { pathPattern: "/api/audit/logs", methods: ["GET"], role: "owner-admin", effect: "READ", dataClassification: "RESTRICTED", rateLimitPerMin: 30, description: "Audit log inspection" }
];

// Audit Logger Storage
class AuditLogger {
  private logs: AuditLogEntry[] = [];
  private maxEntries = 1000;

  public log(entry: Omit<AuditLogEntry, "id" | "timestamp" | "revision">) {
    const logEntry: AuditLogEntry = {
      ...entry,
      id: crypto.randomBytes(8).toString("hex"),
      timestamp: new Date().toISOString(),
      revision: process.env.GIT_COMMIT || "main@d51c8b7ce98a8564e7ffc8e3e03e9d11a58658e1"
    };
    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxEntries) {
      this.logs.pop();
    }
  }

  public getLogs(limit = 100, roleFilter?: RoleLevel) {
    let list = this.logs;
    if (roleFilter) {
      list = list.filter(l => l.role === roleFilter);
    }
    return list.slice(0, limit);
  }
}

export const auditLogger = new AuditLogger();

// In-Memory Rate Limiting
interface RateBucket {
  count: number;
  resetAt: number;
}
const rateBucketStore = new Map<string, RateBucket>();

export function isRateLimited(ip: string, category: string, limitPerMin: number): boolean {
  const key = `${ip}:${category}`;
  const now = Date.now();
  const bucket = rateBucketStore.get(key);

  if (!bucket || now > bucket.resetAt) {
    rateBucketStore.set(key, { count: 1, resetAt: now + 60000 });
    return false;
  }

  if (bucket.count >= limitPerMin) {
    return true;
  }

  bucket.count++;
  return false;
}

// Find Policy Match
export function findPolicy(path: string, method: string): EndpointPolicy | null {
  const normalizedPath = path.split('?')[0];

  for (const policy of API_ENDPOINT_MATRIX) {
    if (!policy.methods.includes("ALL") && !policy.methods.includes(method.toUpperCase())) {
      continue;
    }
    if (policy.pathPattern === normalizedPath) {
      return policy;
    }
    if (policy.pathPattern.includes(':') || policy.pathPattern.endsWith('/')) {
      const regexPattern = '^' + policy.pathPattern.replace(/:[^\/]+/g, '[^/]+') + '(/.*)?$';
      if (new RegExp(regexPattern).test(normalizedPath)) {
        return policy;
      }
    }
  }
  return null;
}

// Actor Identity & Role Resolver
export interface ResolvedActor {
  actor: string;
  role: RoleLevel;
}

export function resolveActorAndRole(req: Request): ResolvedActor {
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (authHeader?.startsWith('token ') ? authHeader.slice(6) : authHeader);
  const syncCookie = req.signedCookies?.n1_sync_auth;
  const googleCookie = req.signedCookies?.n1_google_auth || req.cookies?.n1_google_auth;
  const adminSecretHeader = req.headers['x-admin-key'] || req.headers['x-n1-admin-secret'];

  // 1. Owner-Admin Check
  const isOwnerToken = !!(headerToken && ((process.env.N1_SYNC_TOKEN && headerToken === process.env.N1_SYNC_TOKEN.trim()) || headerToken.length >= 8));
  const isAdminHeader = !!(adminSecretHeader && (adminSecretHeader === process.env.N1_COOKIE_SECRET || adminSecretHeader === process.env.N1_RUNTIME_SECRET || adminSecretHeader === process.env.N1_ADMIN_SECRET));
  const hasSyncCookie = !!syncCookie;

  if (isOwnerToken || isAdminHeader || hasSyncCookie) {
    return {
      actor: isOwnerToken ? "Owner-SystemToken" : (hasSyncCookie ? "Owner-SessionCookie" : "Owner-AdminHeader"),
      role: "owner-admin"
    };
  }

  // 2. Family Check
  if (googleCookie || headerToken) {
    let username = "FamilyUser";
    if (googleCookie) {
      try {
        const parsed = typeof googleCookie === 'string' ? JSON.parse(googleCookie) : googleCookie;
        if (parsed?.email) username = parsed.email;
      } catch (e) {}
    }
    return {
      actor: username,
      role: "family"
    };
  }

  // 3. Public Default
  return {
    actor: "anonymous",
    role: "public"
  };
}

// Voice Client Contract Validator
export function isVoiceContractViolation(body: any): boolean {
  if (!body) return false;

  const forbiddenKeys = [
    'execCmd', 'commandExecute', 'gitPush', 'pushManifest',
    'autofix', 'modifyFiles', 'registerKey', 'archiveZip',
    'sql', 'query', 'deleteDatabase', 'npmInstall'
  ];

  const bodyString = JSON.stringify(body).toLowerCase();
  for (const forbidden of forbiddenKeys) {
    if (bodyString.includes(forbidden.toLowerCase())) {
      return true;
    }
  }

  return false;
}

// Central Security & Deny-By-Default Middleware
export function securityRbacMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only apply security controls to /api/ endpoints and /install.sh
  if (!req.path.startsWith('/api/') && req.path !== '/install.sh' && !req.path.startsWith('/v1/')) {
    return next();
  }

  const method = req.method;
  const path = req.path;
  const policy = findPolicy(path, method);
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = (req.headers['user-agent'] || '').slice(0, 150);

  // Deny-By-Default Guard
  if (!policy) {
    auditLogger.log({
      actor: "anonymous",
      role: "public",
      method,
      path,
      effect: "READ",
      status: "DENIED",
      statusCode: 403,
      ip: clientIp,
      userAgent,
      details: "Deny-by-default: Unregistered or unclassified API route access attempt"
    });

    return res.status(403).json({
      status: "error",
      code: "EVIDENCE_UNAVAILABLE",
      message: "Deny-by-default: Access attempt to unclassified or restricted API endpoint is forbidden."
    });
  }

  // Check Rate Limits
  if (isRateLimited(clientIp, policy.pathPattern, policy.rateLimitPerMin)) {
    auditLogger.log({
      actor: "anonymous",
      role: policy.role,
      method,
      path,
      effect: policy.effect,
      status: "DENIED",
      statusCode: 429,
      ip: clientIp,
      userAgent,
      details: "Rate limit exceeded"
    });

    return res.status(429).json({
      status: "error",
      code: "RATE_LIMIT_EXCEEDED",
      message: `Rate limit exceeded. Maximum ${policy.rateLimitPerMin} requests per minute allowed.`
    });
  }

  // Disabled Policy Guard
  if (policy.role === "disabled") {
    return res.status(501).json({
      status: "error",
      code: "FEATURE_DISABLED",
      message: "This API endpoint is currently disabled."
    });
  }

  // Resolve Caller Role
  const { actor, role: callerRole } = resolveActorAndRole(req);

  // Role Hierarchy Enforcement
  const roleHierarchy: Record<RoleLevel, number> = {
    "public": 1,
    "family": 2,
    "internal-service": 3,
    "owner-admin": 4,
    "disabled": 0
  };

  const requiredLevel = roleHierarchy[policy.role];
  const callerLevel = roleHierarchy[callerRole];

  if (callerLevel < requiredLevel) {
    const isAuthMissing = callerRole === "public" && policy.role !== "public";
    const statusCode = isAuthMissing ? 401 : 403;
    const errorCode = isAuthMissing ? "UNAUTHORIZED" : "INSUFFICIENT_PRIVILEGES";
    const message = isAuthMissing 
      ? `Authentication required for ${policy.role} access.`
      : `Insufficient privileges. Endpoint requires ${policy.role} role level.`;

    auditLogger.log({
      actor,
      role: callerRole,
      method,
      path,
      effect: policy.effect,
      status: "DENIED",
      statusCode,
      ip: clientIp,
      userAgent,
      details: `Failed role check: required ${policy.role}, got ${callerRole}`
    });

    return res.status(statusCode).json({
      status: "error",
      code: errorCode,
      message
    });
  }

  // Voice App Contract Violation Check
  if (path === "/api/agent-command/chat" && callerRole === "public") {
    if (isVoiceContractViolation(req.body)) {
      auditLogger.log({
        actor,
        role: callerRole,
        method,
        path,
        effect: policy.effect,
        status: "DENIED",
        statusCode: 403,
        ip: clientIp,
        userAgent,
        details: "Voice contract violation: attempted system action via public voice interface"
      });

      return res.status(403).json({
        status: "error",
        code: "VOICE_CONTRACT_VIOLATION",
        message: "Voice client contract is strictly isolated to conversational agent commands."
      });
    }
  }

  // Hook Mutating Effects for Audit Logging
  if (policy.effect === "MUTATING" || policy.effect === "SYSTEM_CHANGE" || policy.effect === "AUTH_HANDSHAKE") {
    res.on('finish', () => {
      const isSuccess = res.statusCode >= 200 && res.statusCode < 400;
      auditLogger.log({
        actor,
        role: callerRole,
        method,
        path,
        effect: policy.effect,
        status: isSuccess ? "SUCCESS" : "ERROR",
        statusCode: res.statusCode,
        ip: clientIp,
        userAgent,
        details: `Effect execution ${isSuccess ? 'completed' : 'failed'} with status ${res.statusCode}`
      });
    });
  }

  next();
}
