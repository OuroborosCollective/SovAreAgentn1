import { describe, expect, it } from "vitest";
import {
  allowedMemoriesForContext,
  assessLearningCandidate,
} from "../../src/domain/learningLanes";

const publicMemory = {
  id: "synthetic-public-memory",
  status: "current" as const,
  provenanceComplete: true,
  audience: { kind: "public" as const },
};

const restrictedMemory = {
  id: "synthetic-family-memory",
  status: "current" as const,
  provenanceComplete: true,
  audience: { kind: "restricted" as const, viewers: ["parent", "child"] },
};

const virtualCandidate = (actions: string[]) => ({
  id: "synthetic-virtual-skill",
  lane: "virtual_skills",
  source: { kind: "simulation", ref: "synthetic:simulation-1" },
  actions,
});

describe("learning-lane contract (synthetic inputs only)", () => {
  it("rejects duplicate viewer identities and fails unresolved contexts closed", () => {
    expect(
      allowedMemoriesForContext([restrictedMemory], {
        verifiedViewers: ["parent", "parent"],
        unresolved: false,
      }),
    ).toEqual([]);

    expect(
      allowedMemoriesForContext([publicMemory, restrictedMemory], {
        verifiedViewers: ["parent"],
        unresolved: true,
      }),
    ).toEqual([publicMemory]);
  });

  it("keeps family and knowledge proposals pending despite client-supplied approval claims", () => {
    const familyProposal = {
      id: "synthetic-family-proposal",
      lane: "family_memory",
      source: { kind: "conversation", ref: "synthetic:conversation-1" },
      consent: { state: "confirmed", consentId: "synthetic-consent" },
      speakerVerification: { serverVerified: true },
      dbReadback: { independentlyVerified: true },
    };
    expect(assessLearningCandidate(familyProposal)).toEqual({
      status: "pending",
      gate: "CONSENT_IDENTITY_AND_DURABLE_READBACK",
    });

    const knowledgeProposal = {
      id: "synthetic-knowledge-proposal",
      lane: "verified_knowledge",
      source: { kind: "document", ref: "https://example.test/guide" },
      contentVerified: true,
      reviewApproved: true,
    };
    expect(assessLearningCandidate(knowledgeProposal)).toEqual({
      status: "pending",
      gate: "INDEPENDENT_SOURCE_REVIEW",
    });
  });

  it("rejects insecure or credential-bearing knowledge URLs", () => {
    for (const ref of [
      "http://example.test/guide",
      "file:///private/source",
      "https://user:pass@example.test/guide",
    ]) {
      expect(
        assessLearningCandidate({
          id: "synthetic-invalid-source",
          lane: "verified_knowledge",
          source: { kind: "document", ref },
        }),
      ).toEqual({ status: "rejected", gate: "INVALID_PROPOSAL" });
    }
  });

  it("admits bounded allowlisted simulations only into the sandbox gate", () => {
    for (const count of [1, 12]) {
      expect(
        assessLearningCandidate(
          virtualCandidate(Array.from({ length: count }, () => "wave")),
        ),
      ).toEqual({
        status: "sandbox_only",
        gate: "FRESH_EVALUATION_AND_CHECKPOINT",
      });
    }

    for (const actions of [
      [],
      Array.from({ length: 13 }, () => "wave"),
      ["run_shell"],
    ]) {
      expect(assessLearningCandidate(virtualCandidate(actions))).toEqual({
        status: "rejected",
        gate: "INVALID_PROPOSAL",
      });
    }
  });

  it("does not mutate caller-owned memories or return the original array", () => {
    const item = Object.freeze({ ...publicMemory });
    const memories = Object.freeze([item]);
    const result = allowedMemoriesForContext(memories, {
      verifiedViewers: [],
      unresolved: false,
    });

    expect(result).toEqual([item]);
    expect(result).not.toBe(memories);
    expect(item.status).toBe("current");
  });
});
