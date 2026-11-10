import { describe, expect, it } from "vitest";
import {
  allowedMemoriesForContext,
  type FamilyMemoryCandidate,
  type LearningCandidate,
  type VerifiedKnowledgeCandidate,
  type VirtualSkillCandidate,
} from "../../src/domain/learningLanes";

const familyMemory = (
  overrides: Partial<FamilyMemoryCandidate> = {},
): FamilyMemoryCandidate => ({
  id: "synthetic-family-event",
  lane: "family_memory",
  provenance: {
    status: "current",
    sourceRef: "synthetic:event-1",
    sourceKind: "conversation",
  },
  audience: { kind: "restricted", authorizedAudienceSets: [["speaker-1"]] },
  speakerVerification: { speakerId: "speaker-1", serverVerified: true },
  consent: {
    state: "confirmed",
    revocable: true,
    consentId: "synthetic-consent",
  },
  dbReadback: {
    independentlyVerified: true,
    eventId: "synthetic:event-1",
    hash: "synthetic-hash",
  },
  ...overrides,
});

const knowledge = (
  overrides: Partial<VerifiedKnowledgeCandidate> = {},
): VerifiedKnowledgeCandidate => ({
  id: "synthetic-document-fact",
  lane: "verified_knowledge",
  provenance: {
    status: "current",
    sourceRef: "https://example.test/guide",
    sourceKind: "https_document",
  },
  audience: { kind: "public" },
  sourceUrl: "https://example.test/guide",
  contentVerified: true,
  ...overrides,
});

const virtualSkill = (
  actionCount = 2,
  overrides: Partial<VirtualSkillCandidate> = {},
): VirtualSkillCandidate => ({
  id: "synthetic-sandbox-skill",
  lane: "virtual_skills",
  provenance: {
    status: "current",
    sourceRef: "synthetic:sandbox-run",
    sourceKind: "virtual_sandbox",
  },
  audience: { kind: "public" },
  sandboxed: true,
  actions: Array.from({ length: actionCount }, (_, index) => ({
    actionId: `synthetic-action-${index + 1}`,
    allowlisted: true,
  })),
  effects: {
    trainsModel: false,
    downloadsModel: false,
    autonomousExecution: false,
    updatesWeights: false,
  },
  ...overrides,
});

describe("learning-lane contract (synthetic inputs only)", () => {
  it("keeps family memory unavailable unless conversation, consent, verified speaker and DB receipt all exist", () => {
    const valid = familyMemory();
    expect(
      allowedMemoriesForContext([valid], { viewerIds: ["speaker-1"] }),
    ).toEqual([valid]);

    const revoked = familyMemory({
      consent: {
        state: "revoked",
        revocable: true,
        consentId: "synthetic-consent",
      },
    });
    const unverifiedSpeaker = familyMemory({
      speakerVerification: { speakerId: "speaker-1", serverVerified: false },
    });
    const missingReadback = familyMemory({ dbReadback: undefined });
    const wrongSource = familyMemory({
      provenance: {
        status: "current",
        sourceRef: "synthetic:import",
        sourceKind: "https_document",
      } as FamilyMemoryCandidate["provenance"],
    });
    expect(
      allowedMemoriesForContext(
        [revoked, unverifiedSpeaker, missingReadback, wrongSource],
        { viewerIds: ["speaker-1"] },
      ),
    ).toEqual([]);
  });

  it("requires HTTPS and separate content verification; a link alone is not truth", () => {
    const http = knowledge({ sourceUrl: "http://example.test/guide" });
    const unverified = knowledge({ contentVerified: false });
    const credentialUrl = knowledge({
      sourceUrl: "https://user:pass@example.test/guide",
    });
    expect(
      allowedMemoriesForContext([http, unverified, credentialUrl], {
        viewerIds: null,
      }),
    ).toEqual([]);
    const verified = knowledge();
    expect(allowedMemoriesForContext([verified], { viewerIds: null })).toEqual([
      verified,
    ]);
  });

  it("admits only bounded, allowlisted virtual candidates and forbids model or autonomous effects", () => {
    const boundaries = [virtualSkill(1), virtualSkill(12)];
    expect(allowedMemoriesForContext(boundaries, { viewerIds: null })).toEqual(
      boundaries,
    );

    const invalid = [
      virtualSkill(0),
      virtualSkill(13),
      virtualSkill(1, { sandboxed: false }),
      virtualSkill(1, {
        actions: [{ actionId: "synthetic-action", allowlisted: false }],
      }),
      virtualSkill(1, {
        effects: {
          trainsModel: true,
          downloadsModel: false,
          autonomousExecution: false,
          updatesWeights: false,
        },
      }),
      virtualSkill(1, {
        effects: {
          trainsModel: false,
          downloadsModel: true,
          autonomousExecution: false,
          updatesWeights: false,
        },
      }),
      virtualSkill(1, {
        effects: {
          trainsModel: false,
          downloadsModel: false,
          autonomousExecution: true,
          updatesWeights: false,
        },
      }),
      virtualSkill(1, {
        effects: {
          trainsModel: false,
          downloadsModel: false,
          autonomousExecution: false,
          updatesWeights: true,
        },
      }),
    ];
    expect(allowedMemoriesForContext(invalid, { viewerIds: null })).toEqual([]);
  });

  it("fails closed for unknown viewers except explicitly public candidates with current provenance", () => {
    const publicCurrent = knowledge();
    const stalePublic = knowledge({
      provenance: {
        status: "stale",
        sourceRef: "https://example.test/guide",
        sourceKind: "https_document",
      },
    });
    const privateMemory = familyMemory();
    const mixed: LearningCandidate[] = [
      publicCurrent,
      stalePublic,
      privateMemory,
    ];
    expect(allowedMemoriesForContext(mixed, { viewerIds: null })).toEqual([
      publicCurrent,
    ]);
    expect(allowedMemoriesForContext(mixed, { viewerIds: [] })).toEqual([
      publicCurrent,
    ]);
  });

  it("requires the whole multi-viewer request to match one authorized audience set, never a union", () => {
    const separateGrants = familyMemory({
      audience: {
        kind: "restricted",
        authorizedAudienceSets: [["parent"], ["child"]],
      },
    });
    const oneGroup = familyMemory({
      audience: {
        kind: "restricted",
        authorizedAudienceSets: [["parent", "child"]],
      },
    });
    expect(
      allowedMemoriesForContext([separateGrants], {
        viewerIds: ["parent", "child"],
      }),
    ).toEqual([]);
    expect(
      allowedMemoriesForContext([oneGroup], { viewerIds: ["child", "parent"] }),
    ).toEqual([oneGroup]);
    expect(
      allowedMemoriesForContext([oneGroup], {
        viewerIds: ["parent", "parent", "child"],
      }),
    ).toEqual([]);
    expect(
      allowedMemoriesForContext([oneGroup], { viewerIds: ["parent", ""] }),
    ).toEqual([]);
  });

  it("does not mutate the caller-owned candidate list or candidate records", () => {
    const item = knowledge();
    const list = Object.freeze([
      Object.freeze(item),
    ]) as readonly LearningCandidate[];
    const result = allowedMemoriesForContext(list, { viewerIds: null });
    expect(result).toEqual([item]);
    expect(result).not.toBe(list);
  });
});
