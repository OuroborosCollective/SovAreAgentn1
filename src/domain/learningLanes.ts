/**
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