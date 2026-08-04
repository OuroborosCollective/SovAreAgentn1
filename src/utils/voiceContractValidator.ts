// Versioned Voice-Event Contract Validator (v1.0.0)
// Part of N+1 Bidirectional Voice Session Architecture

export interface VoiceEvent {
  eventId: string;
  type: 
    | 'session.handshake'
    | 'audio.chunk'
    | 'stt.result'
    | 'dialog.request'
    | 'dialog.response'
    | 'tts.chunk'
    | 'session.barge_in'
    | 'session.state_change'
    | 'session.error';
  version: '1.0.0';
  sessionId: string;
  sequenceNumber: number;
  timestamp: number;
  payload: Record<string, any>;
}

export interface SessionHandshake {
  sessionId: string;
  token: string;
  version: string;
  capabilities: string[];
  clientPlatform: 'web' | 'android' | 'ios';
  timestamp: number;
}

export function validateVoiceEvent(event: any): { isValid: boolean; error?: string } {
  if (!event || typeof event !== 'object') {
    return { isValid: false, error: 'Event must be a non-null object' };
  }
  if (typeof event.eventId !== 'string' || !event.eventId) {
    return { isValid: false, error: 'Event missing or invalid eventId' };
  }
  if (typeof event.type !== 'string' || !event.type) {
    return { isValid: false, error: 'Event missing or invalid type' };
  }
  if (event.version !== '1.0.0') {
    return { isValid: false, error: `Invalid contract version: expected '1.0.0', got '${event.version}'` };
  }
  if (typeof event.sessionId !== 'string' || !event.sessionId) {
    return { isValid: false, error: 'Event missing or invalid sessionId' };
  }
  if (typeof event.sequenceNumber !== 'number' || event.sequenceNumber < 0) {
    return { isValid: false, error: 'Event missing or invalid sequenceNumber' };
  }
  if (typeof event.timestamp !== 'number' || event.timestamp <= 0) {
    return { isValid: false, error: 'Event missing or invalid timestamp' };
  }
  if (!event.payload || typeof event.payload !== 'object') {
    return { isValid: false, error: 'Event missing or invalid payload' };
  }

  // Type-specific schema verification
  switch (event.type) {
    case 'session.handshake':
      if (typeof event.payload.token !== 'string' || !event.payload.token) {
        return { isValid: false, error: 'Handshake payload missing token' };
      }
      if (!Array.isArray(event.payload.capabilities)) {
        return { isValid: false, error: 'Handshake payload capabilities must be an array' };
      }
      break;
    case 'audio.chunk':
      if (typeof event.payload.base64Audio !== 'string') {
        return { isValid: false, error: 'Audio chunk payload must contain base64Audio string' };
      }
      break;
    case 'stt.result':
      if (typeof event.payload.text !== 'string') {
        return { isValid: false, error: 'STT result payload must contain text string' };
      }
      if (typeof event.payload.isFinal !== 'boolean') {
        return { isValid: false, error: 'STT result payload must contain isFinal boolean' };
      }
      break;
    case 'dialog.request':
      if (typeof event.payload.query !== 'string') {
        return { isValid: false, error: 'Dialog request payload must contain query string' };
      }
      break;
    case 'dialog.response':
      if (typeof event.payload.response !== 'string') {
        return { isValid: false, error: 'Dialog response payload must contain response string' };
      }
      break;
    case 'tts.chunk':
      if (typeof event.payload.base64Audio !== 'string') {
        return { isValid: false, error: 'TTS chunk payload must contain base64Audio string' };
      }
      break;
    case 'session.barge_in':
      if (typeof event.payload.interruptedAtMs !== 'number') {
        return { isValid: false, error: 'Barge-in payload must contain interruptedAtMs number' };
      }
      break;
    case 'session.state_change':
      if (typeof event.payload.state !== 'string') {
        return { isValid: false, error: 'State change payload must contain state string' };
      }
      break;
    case 'session.error':
      if (typeof event.payload.errorCode !== 'string') {
        return { isValid: false, error: 'Error payload must contain errorCode string' };
      }
      if (typeof event.payload.message !== 'string') {
        return { isValid: false, error: 'Error payload must contain message string' };
      }
      break;
    default:
      return { isValid: false, error: `Unknown voice event type: ${event.type}` };
  }

  return { isValid: true };
}

export class IdempotencyValidator {
  private processedIds: Set<string> = new Set();
  private lastSequenceNumber: number = -1;

  public processEvent(event: VoiceEvent): { isDuplicate: boolean; isOutOfOrder: boolean } {
    const isDuplicate = this.processedIds.has(event.eventId);
    if (isDuplicate) {
      return { isDuplicate: true, isOutOfOrder: false };
    }

    const isOutOfOrder = event.sequenceNumber <= this.lastSequenceNumber;
    
    // Accept event
    this.processedIds.add(event.eventId);
    if (event.sequenceNumber > this.lastSequenceNumber) {
      this.lastSequenceNumber = event.sequenceNumber;
    }

    return { isDuplicate: false, isOutOfOrder };
  }

  public clear() {
    this.processedIds.clear();
    this.lastSequenceNumber = -1;
  }
}
