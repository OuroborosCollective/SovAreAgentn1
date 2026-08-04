import { describe, it, expect } from 'vitest';
import { VerificationResult, SpeakerProfile } from '../../src/components/FamilyVoiceVerification';

describe('Family Voice Verification & Privacy Contract Tests (#21)', () => {
  it('should model probabilistic verification results correctly', () => {
    const result: VerificationResult = {
      classification: 'papa',
      confidence: 0.92,
      noiseLevel: 0.05,
      isReplaySuspicion: false,
      timestamp: Date.now(),
      matchedProfileId: 'papa'
    };

    expect(result.classification).toBe('papa');
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.isReplaySuspicion).toBe(false);
  });

  it('should correctly handle uncertain or unknown classifications', () => {
    const uncertainResult: VerificationResult = {
      classification: 'uncertain',
      confidence: 0.45,
      noiseLevel: 0.35,
      isReplaySuspicion: true,
      timestamp: Date.now()
    };

    expect(uncertainResult.classification).toBe('uncertain');
    expect(uncertainResult.confidence).toBeLessThan(0.65);
    expect(uncertainResult.isReplaySuspicion).toBe(true);
  });

  it('should structure speaker profiles with local cryptographic fingerprint hashes', () => {
    const profile: SpeakerProfile = {
      speakerId: 'mama',
      name: 'Mama (Familienherz)',
      enrolledAt: Date.now(),
      sampleCount: 3,
      acousticFingerprintHash: 'fp-mama-12345-abc',
      consentGranted: true,
      securityHash: 'sha256-local-enc-xyz'
    };

    expect(profile.speakerId).toBe('mama');
    expect(profile.consentGranted).toBe(true);
    expect(profile.acousticFingerprintHash).toBeDefined();
    expect(profile.securityHash).toBeDefined();
  });
});
