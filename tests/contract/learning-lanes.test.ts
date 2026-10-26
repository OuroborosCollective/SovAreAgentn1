import { describe, expect, it } from 'vitest';
import { assessLearningCandidate, allowedMemoriesForContext } from '../../src/domain/learningLanes';

const publicMemory = { id: 'public-1', status: 'current' as const, provenanceComplete: true, audience: { kind: 'public' as const } };
const ownerMemory = { id: 'owner-1', status: 'current' as const, provenanceComplete: true, audience: { kind: 'restricted' as const, viewers: ['owner'] } };
const sharedMemory = { id: 'shared-1', status: 'current' as const, provenanceComplete: true, audience: { kind: 'restricted' as const, viewers: ['owner', 'mama'] } };

describe('N+1 isolated continual learning gates (pure contract, no live authorization)', () => {
  it('fails closed to public-only when viewer identity is unresolved', () => {
    const memories = [publicMemory, ownerMemory, sharedMemory];
    expect(allowedMemoriesForContext(memories, { verifiedViewers: ['owner'], unresolved: true }).map(m => m.id)).toEqual(['public-1']);
    expect(allowedMemoriesForContext(memories, { verifiedViewers: [], unresolved: false }).map(m => m.id)).toEqual(['public-1']);
  });

  it('requires every viewer to be within one authorized audience, not their union', () => {
    const grantedMemory = { ...ownerMemory, id: 'grant-1', grants: [['owner', 'papa'], ['owner', 'mama']] };
    expect(allowedMemoriesForContext([grantedMemory], { verifiedViewers: ['owner', 'papa'], unresolved: false }).map(m => m.id)).toEqual(['grant-1']);
    expect(allowedMemoriesForContext([grantedMemory], { verifiedViewers: ['owner', 'papa', 'mama'], unresolved: false })).toEqual([]);
  });

  it('keeps owner-private facts away from mama and guest contexts', () => {
    expect(allowedMemoriesForContext([publicMemory, ownerMemory, sharedMemory], { verifiedViewers: ['owner', 'mama'], unresolved: false }).map(m => m.id)).toEqual(['public-1', 'shared-1']);
    expect(allowedMemoriesForContext([publicMemory, ownerMemory, sharedMemory], { verifiedViewers: ['owner', 'guest'], unresolved: false }).map(m => m.id)).toEqual(['public-1']);
  });

  it('never retrieves revoked, superseded or provenance-incomplete memories', () => {
    const memories = [
      { ...publicMemory, id: 'revoked', status: 'revoked' as const },
      { ...publicMemory, id: 'superseded', status: 'superseded' as const },
      { ...ownerMemory, id: 'broken', provenanceComplete: false },
    ];
    expect(allowedMemoriesForContext(memories, { verifiedViewers: ['owner'], unresolved: false })).toEqual([]);
  });

  it('family learning is never auto-accepted, even with a chosen papa label', () => {
    expect(assessLearningCandidate({ id: 'f1', lane: 'family_memory', source: { kind: 'conversation', ref: 'turn-9' }, proposedBy: 'papa' })).toEqual({ status: 'pending', gate: 'CONSENT_IDENTITY_AND_DURABLE_READBACK' });
  });

  it('verified knowledge needs a review after source provenance', () => {
    expect(assessLearningCandidate({ id: 'k1', lane: 'verified_knowledge', source: { kind: 'document', ref: 'https://example.org/study' } })).toEqual({ status: 'pending', gate: 'INDEPENDENT_SOURCE_REVIEW' });
    expect(assessLearningCandidate({ id: 'k2', lane: 'verified_knowledge', source: { kind: 'document', ref: 'file:///secrets' } }).status).toBe('rejected');
  });

  it('robotics demonstrations cannot automatically become autobiography', () => {
    expect(assessLearningCandidate({ id: 'bad', lane: 'family_memory', source: { kind: 'simulation', ref: 'trajectory-1' } }).status).toBe('rejected');
  });

  it('caps virtual action plans and never grants execution or model updates', () => {
    const base = { id: 's1', lane: 'virtual_skills', source: { kind: 'simulation', ref: 'virtual-playroom-v1' } };
    expect(assessLearningCandidate({ ...base, actions: ['look', 'wave', 'sit'] })).toEqual({ status: 'sandbox_only', gate: 'FRESH_EVALUATION_AND_CHECKPOINT' });
    expect(assessLearningCandidate({ ...base, actions: ['run-shell'] }).status).toBe('rejected');
    expect(assessLearningCandidate({ ...base, actions: Array(13).fill('wave') }).status).toBe('rejected');
    expect(assessLearningCandidate({ ...base, actions: [] }).status).toBe('rejected');
  });

  it('rejects unrecognised lanes and missing provenance without side effects', () => {
    expect(assessLearningCandidate({ id: 'x1', lane: 'free_form', source: { kind: 'document', ref: 'https://example.org' } }).status).toBe('rejected');
    expect(assessLearningCandidate({ id: 'x2', lane: 'virtual_skills', actions: ['look'] }).status).toBe('rejected');
  });
});