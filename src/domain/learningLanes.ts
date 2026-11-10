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
}
