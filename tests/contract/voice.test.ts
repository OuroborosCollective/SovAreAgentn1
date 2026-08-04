import { describe, it, expect } from 'vitest';
import { validateVoiceEvent, IdempotencyValidator, VoiceEvent } from '../../src/utils/voiceContractValidator';

describe('Voice Event Contract and Session Handshake Tests', () => {
  it('should successfully validate a v1.0.0 session handshake event', () => {
    const handshakeEvent: VoiceEvent = {
      eventId: 'evt-test-1',
      type: 'session.handshake',
      version: '1.0.0',
      sessionId: 'ses-test-1',
      sequenceNumber: 0,
      timestamp: Date.now(),
      payload: {
        token: 'test-handshake-jwt-token-xyz',
        capabilities: ['speech-to-text', 'dialog-flow', 'text-to-speech', 'barge-in'],
        clientPlatform: 'web'
      }
    };

    const result = validateVoiceEvent(handshakeEvent);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should fail validation if version is not 1.0.0', () => {
    const invalidEvent = {
      eventId: 'evt-test-2',
      type: 'session.handshake',
      version: '2.0.0', // invalid version
      sessionId: 'ses-test-1',
      sequenceNumber: 0,
      timestamp: Date.now(),
      payload: {
        token: 'test-token',
        capabilities: [],
        clientPlatform: 'web'
      }
    };

    const result = validateVoiceEvent(invalidEvent);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Invalid contract version');
  });

  it('should successfully validate STT result events', () => {
    const sttEvent: VoiceEvent = {
      eventId: 'evt-test-3',
      type: 'stt.result',
      version: '1.0.0',
      sessionId: 'ses-test-1',
      sequenceNumber: 2,
      timestamp: Date.now(),
      payload: {
        text: 'Hello N+1, can you report the system status?',
        isFinal: true
      }
    };

    const result = validateVoiceEvent(sttEvent);
    expect(result.isValid).toBe(true);
  });

  it('should fail STT result events missing mandatory properties', () => {
    const sttEventInvalid = {
      eventId: 'evt-test-4',
      type: 'stt.result',
      version: '1.0.0',
      sessionId: 'ses-test-1',
      sequenceNumber: 2,
      timestamp: Date.now(),
      payload: {
        text: 12345, // invalid text type (should be string)
        isFinal: 'yes' // invalid isFinal type
      }
    };

    const result = validateVoiceEvent(sttEventInvalid);
    expect(result.isValid).toBe(false);
  });

  it('should enforce idempotency by ignoring duplicate eventIds', () => {
    const validator = new IdempotencyValidator();
    
    const event1: VoiceEvent = {
      eventId: 'evt-unique-100',
      type: 'audio.chunk',
      version: '1.0.0',
      sessionId: 'ses-test-1',
      sequenceNumber: 5,
      timestamp: Date.now(),
      payload: { base64Audio: 'chunk-1' }
    };

    // First processing should succeed
    const res1 = validator.processEvent(event1);
    expect(res1.isDuplicate).toBe(false);

    // Duplicate eventId should be flagged as duplicate
    const res2 = validator.processEvent(event1);
    expect(res2.isDuplicate).toBe(true);
  });

  it('should detect and handle out-of-order sequence drift gracefully', () => {
    const validator = new IdempotencyValidator();
    
    const eventSeq5: VoiceEvent = {
      eventId: 'evt-seq-5',
      type: 'audio.chunk',
      version: '1.0.0',
      sessionId: 'ses-test-1',
      sequenceNumber: 5,
      timestamp: Date.now(),
      payload: { base64Audio: 'chunk-5' }
    };

    const eventSeq3: VoiceEvent = {
      eventId: 'evt-seq-3',
      type: 'audio.chunk',
      version: '1.0.0',
      sessionId: 'ses-test-1',
      sequenceNumber: 3, // out of order (less than current max 5)
      timestamp: Date.now(),
      payload: { base64Audio: 'chunk-3' }
    };

    // Process higher sequence first
    validator.processEvent(eventSeq5);

    // Process lower sequence should flag out of order, but NOT duplicate
    const res = validator.processEvent(eventSeq3);
    expect(res.isDuplicate).toBe(false);
    expect(res.isOutOfOrder).toBe(true);
  });
});
