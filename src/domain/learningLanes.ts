/**
 * Pure, deterministic reference rules for N+1 learning-lane candidates.
 *
 * This module performs no authentication, database access, persistence, provider
 * calls, or action execution. A trusted backend adapter must construct these
 * evidence fields from authenticated viewers, stored policy, current provenance,
 * revocable consent, and independently verified database readback. These rules
 * alone are not a security guarantee or proof of a live memory integration.
 */

export type LearningLane =
  "family_memory" | "verified_knowledge" | "virtual_skills";
export type ProvenanceStatus = "current" | "stale" | "unknown";

export interface CandidateProvenance {
  readonly status: ProvenanceStatus;
  readonly sourceRef: string;
}

export interface PublicAudiencePolicy {
  readonly kind: "public";
}

export interface RestrictedAudiencePolicy {
  readonly kind: "restricted";
  /** Each entry is one complete, independently granted audience set. */
  readonly authorizedAudienceSets: readonly (readonly string[])[];
}

export type AudiencePolicy = PublicAudiencePolicy | RestrictedAudiencePolicy;

interface CandidateBase<Lane extends LearningLane> {
  readonly id: string;
  readonly lane: Lane;
  readonly provenance: CandidateProvenance;
  readonly audience: AudiencePolicy;
}

export interface FamilyMemoryCandidate extends CandidateBase<"family_memory"> {
  readonly provenance: CandidateProvenance & {
    readonly sourceKind: "conversation";
  };
  /** Family memory is private; it cannot be declared public to bypass identity checks. */
  readonly audience: RestrictedAudiencePolicy;
  readonly speakerVerification?: {
    readonly speakerId: string;
    readonly serverVerified: boolean;
  };
  readonly consent?: {
    readonly state: "confirmed" | "missing" | "revoked";
    readonly revocable: boolean;
    readonly consentId: string;
  };
  readonly dbReadback?: {
    readonly independentlyVerified: boolean;
    readonly eventId: string;
    readonly hash: string;
  };
}

export interface VerifiedKnowledgeCandidate extends CandidateBase<"verified_knowledge"> {
  readonly provenance: CandidateProvenance & {
    readonly sourceKind: "https_document";
  };
  readonly sourceUrl: string;
  /** A URL alone is not a content-verification proof. */
  readonly contentVerified: boolean;
}

export interface VirtualSkillCandidate extends CandidateBase<"virtual_skills"> {
  readonly provenance: CandidateProvenance & {
    readonly sourceKind: "virtual_sandbox";
  };
  readonly sandboxed: boolean;
  readonly actions: readonly {
    readonly actionId: string;
    readonly allowlisted: boolean;
  }[];
  readonly effects: {
    readonly trainsModel: boolean;
    readonly downloadsModel: boolean;
    readonly autonomousExecution: boolean;
    readonly updatesWeights: boolean;
  };
}

export type LearningCandidate =
  FamilyMemoryCandidate | VerifiedKnowledgeCandidate | VirtualSkillCandidate;

export interface LearningContext {
  /** `null` or an empty set means that viewer identity has not been resolved. */
  readonly viewerIds: readonly string[] | null;
}

const MAX_VIRTUAL_SKILL_ACTIONS = 12;

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasCurrentProvenance(candidate: LearningCandidate): boolean {
  return (
    candidate.provenance.status === "current" &&
    hasText(candidate.provenance.sourceRef)
  );
}

function isVerifiedHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.length > 0 &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

function isEligibleCandidate(candidate: LearningCandidate): boolean {
  if (!hasText(candidate.id) || !hasCurrentProvenance(candidate)) return false;

  switch (candidate.lane) {
    case "family_memory":
      return (
        candidate.provenance.sourceKind === "conversation" &&
        hasText(candidate.speakerVerification?.speakerId) &&
        candidate.speakerVerification?.serverVerified === true &&
        candidate.consent?.state === "confirmed" &&
        candidate.consent.revocable === true &&
        hasText(candidate.consent.consentId) &&
        candidate.dbReadback?.independentlyVerified === true &&
        hasText(candidate.dbReadback.eventId) &&
        hasText(candidate.dbReadback.hash)
      );

    case "verified_knowledge":
      return (
        candidate.provenance.sourceKind === "https_document" &&
        isVerifiedHttpsUrl(candidate.sourceUrl) &&
        candidate.contentVerified === true
      );

    case "virtual_skills":
      return (
        candidate.provenance.sourceKind === "virtual_sandbox" &&
        candidate.sandboxed === true &&
        Array.isArray(candidate.actions) &&
        candidate.actions.length >= 1 &&
        candidate.actions.length <= MAX_VIRTUAL_SKILL_ACTIONS &&
        candidate.actions.every(
          (action) => hasText(action.actionId) && action.allowlisted === true,
        ) &&
        candidate.effects.trainsModel === false &&
        candidate.effects.downloadsModel === false &&
        candidate.effects.autonomousExecution === false &&
        candidate.effects.updatesWeights === false
      );
  }
}

function canonicalAudience(
  ids: readonly string[] | null | undefined,
): string[] | null {
  if (!Array.isArray(ids) || ids.length === 0 || !ids.every(hasText))
    return null;
  const normalized = ids.map((id) => id.trim());
  if (new Set(normalized).size !== normalized.length) return null;
  return normalized.sort();
}

function hasAudienceAccess(
  audience: AudiencePolicy,
  viewerIds: readonly string[] | null,
): boolean {
  if (audience.kind === "public") return true;

  const requested = canonicalAudience(viewerIds);
  if (!requested || !Array.isArray(audience.authorizedAudienceSets))
    return false;

  // Require one stored set to match the whole request. Never union grants from
  // separate audiences (for example, parent-only plus child-only).
  return audience.authorizedAudienceSets.some((storedSet) => {
    const authorized = canonicalAudience(storedSet);
    return (
      authorized !== null &&
      authorized.length === requested.length &&
      authorized.every((viewerId, index) => viewerId === requested[index])
    );
  });
}

/**
 * Select eligible candidates for a context without I/O or side effects.
 *
 * Unresolved identities may receive only explicitly public candidates with
 * current provenance. Private access requires an exact match to one complete,
 * stored authorized audience set. The caller remains responsible for proving
 * that every input field came from trusted, authenticated sources.
 */
export function allowedMemoriesForContext(
  candidates: readonly LearningCandidate[],
  context: LearningContext,
): LearningCandidate[] {
  return candidates.filter(
    (candidate) =>
      isEligibleCandidate(candidate) &&
      hasAudienceAccess(candidate.audience, context.viewerIds),
  );
 * N+1 learning separation: pure, side-effect-free CONTRACT HELPERS only.
 * They do not authenticate people, grant consent, execute robot actions, persist
 * memory or perform model updates. Backend adapters MUST supply verified
 * identities, signed consent decisions, complete lineage and database receipts.
 */
export type N1LearningLane = 'family_memory' | 'verified_knowledge' | 'virtual_skills';
export type CandidateAssessment =
  | { status: 'rejected'; gate: 'INVALID_PROPOSAL' }
  | { status: 'pending'; gate: 'CONSENT_IDENTITY_AND_DURABLE_READBACK' | 'INDEPENDENT_SOURCE_REVIEW' }
  | { status: 'sandbox_only'; gate: 'FRESH_EVALUATION_AND_CHECKPOINT' };

export type MemoryAudience =
  | { kind: 'public' }
  | { kind: 'restricted'; viewers: readonly string[] };

export interface AudienceBoundMemory {
  id: string;
  status: 'current' | 'revoked' | 'superseded' | 'quarantined';
  provenanceComplete: boolean;
  audience: MemoryAudience;
  /** Exact item-specific grants. Never union these audience sets. */
  grants?: readonly (readonly string[])[];
}

export interface VerifiedViewerContext {
  /** Identifiers resolved and authenticated by the SERVER, never a UI role toggle. */
  verifiedViewers: readonly string[];
  /** Unknown/conflicting viewer identities fail closed to public-only. */
  unresolved: boolean;
}

const validViewers = (viewers: unknown): viewers is readonly string[] =>
  Array.isArray(viewers) && viewers.length > 0 && viewers.length <= 32
  && viewers.every(v => typeof v === 'string' && v.length > 0 && v.length <= 128);

/** Must be called BEFORE a memory can enter a model prompt or ranker context. */
export function allowedMemoriesForContext<T extends AudienceBoundMemory>(
  memories: readonly T[], context: VerifiedViewerContext,
): T[] {
  const resolved = !context.unresolved && validViewers(context.verifiedViewers);
  return memories.filter(memory => {
    if (memory.status !== 'current' || memory.provenanceComplete !== true) return false;
    if (memory.audience?.kind === 'public') return true;
    if (!resolved || memory.audience?.kind !== 'restricted') return false;
    const audiences = [memory.audience.viewers, ...(memory.grants ?? [])];
    return audiences.some(audience => validViewers(audience)
      && context.verifiedViewers.every(viewer => audience.includes(viewer)));
  });
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const validText = (value: unknown, limit: number): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= limit;

const isHttpsSource = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && Boolean(parsed.hostname) && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
};

/**
 * A simulation trajectory can be proposed for virtual play only; it must never
 * be treated as an autobiographical memory or installed as a live motor policy.
 */
export function assessLearningCandidate(value: unknown): CandidateAssessment {
  const rejected: CandidateAssessment = { status: 'rejected', gate: 'INVALID_PROPOSAL' };
  if (!isRecord(value) || !validText(value.id, 128) || !isRecord(value.source)
    || !validText(value.source.ref, 512)) return rejected;

  switch (value.lane) {
    case 'family_memory':
      if (value.source.kind !== 'conversation') return rejected;
      return { status: 'pending', gate: 'CONSENT_IDENTITY_AND_DURABLE_READBACK' };
    case 'verified_knowledge':
      if (value.source.kind !== 'document' || !isHttpsSource(value.source.ref)) return rejected;
      return { status: 'pending', gate: 'INDEPENDENT_SOURCE_REVIEW' };
    case 'virtual_skills': {
      if (value.source.kind !== 'simulation' || !Array.isArray(value.actions)
        || value.actions.length < 1 || value.actions.length > 12) return rejected;
      const allowedActions = new Set(['look', 'wave', 'sit', 'stand', 'walk', 'pick_toy', 'place_toy', 'open_book']);
      if (!value.actions.every(action => typeof action === 'string' && allowedActions.has(action))) return rejected;
      return { status: 'sandbox_only', gate: 'FRESH_EVALUATION_AND_CHECKPOINT' };
    }
    default:
      return rejected;
  }
}
