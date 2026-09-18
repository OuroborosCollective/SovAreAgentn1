/**
 * Unit Tests for GoogleApiKeyManager Service
 * 
 * Tests the core functionality of the API key management system:
 * - Key validation and format checking
 * - Adding, removing, and activating keys
 * - Quota tracking and failover logic
 * - Runtime integrity checks
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Store for localStorage mock
let localStorageStore: Record<string, string> = {};

// Mock localStorage for Node environment before importing the module
const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageStore[key] || null),
  setItem: vi.fn((key: string, value: string) => { localStorageStore[key] = value; }),
  removeItem: vi.fn((key: string) => { delete localStorageStore[key]; }),
  clear: vi.fn(() => { localStorageStore = {}; })
};

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock the GoogleGenAI
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        list: vi.fn().mockResolvedValue({ models: [] })
      }
    }))
  };
});

// Helper to create fresh manager for each test
async function getManager() {
  // Clear storage
  localStorageStore = {};
  localStorageMock.getItem.mockReturnValue(null);
  
  const { GoogleApiKeyManager } = await import('../../src/services/googleApiKeyManager');
  // Reset the singleton to get a fresh instance
  GoogleApiKeyManager.resetInstance();
  const manager = GoogleApiKeyManager.getInstance();
  
  // Clear any existing keys
  manager.clearAllKeys();
  return manager;
}

describe('GoogleApiKeyManager', () => {
  beforeEach(async () => {
    // Reset storage
    localStorageStore = {};
    localStorageMock.getItem.mockReturnValue(null);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Key Format Validation', () => {
    it('should validate correct API key format', async () => {
      const manager = await getManager();
      const result = manager.validateKeyFormat('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y');
      expect(result.isValid).toBe(true);
    });

    it('should reject keys that do not start with AIza', async () => {
      const manager = await getManager();
      // Short string that's not AIza prefix
      const result = manager.validateKeyFormat('invalid_key');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject keys that are too short', async () => {
      const manager = await getManager();
      const result = manager.validateKeyFormat('AIzaAb');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too short');
    });

    it('should reject keys that are too long', async () => {
      const manager = await getManager();
      const longKey = 'AIza' + 'a'.repeat(100);
      const result = manager.validateKeyFormat(longKey);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too long');
    });

    it('should reject empty or null keys', async () => {
      const manager = await getManager();
      expect(manager.validateKeyFormat('').isValid).toBe(false);
      expect(manager.validateKeyFormat('   ').isValid).toBe(false);
    });
  });

  describe('Key Management Operations', () => {
    it('should add a valid API key', async () => {
      const manager = await getManager();
      // Use addKeyDirect to bypass API call for testing
      const result = manager.addKeyDirect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y', 'Test Key');
      expect(result.success).toBe(true);
      expect(result.keyId).toBeDefined();
    });

    it('should reject duplicate keys', async () => {
      const manager = await getManager();
      await (manager as any).addKeyDirect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y', 'Test Key');
      const result = await (manager as any).addKeyDirect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y', 'Duplicate Key');
      expect(result.success).toBe(false);
      expect(result.error).toContain('already registered');
    });

    it('should reject keys beyond maximum limit', async () => {
      const manager = await getManager();
      // Add 10 keys (max limit)
      for (let i = 0; i < 10; i++) {
        await (manager as any).addKeyDirect(`AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN${i}`, `Key ${i}`);
      }
      // Try to add one more
      const result = await (manager as any).addKeyDirect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN99', 'Extra Key');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Maximum');
    });

    it('should remove a key successfully', async () => {
      const manager = await getManager();
      const addResult = await (manager as any).addKeyDirect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y', 'Test Key');
      const removeResult = manager.removeKey(addResult.keyId!);
      expect(removeResult.success).toBe(true);
    });

    it('should return error when removing non-existent key', async () => {
      const manager = await getManager();
      const removeResult = manager.removeKey('non_existent_id');
      expect(removeResult.success).toBe(false);
      expect(removeResult.error).toContain('not found');
    });

    it('should auto-activate first key when added', async () => {
      const manager = await getManager();
      const result = await (manager as any).addKeyDirect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y', 'First Key');
      expect(result.success).toBe(true);
      const activeKey = manager.getActiveKey();
      expect(activeKey).toBeDefined();
      expect(activeKey?.keyId).toBe(result.keyId);
    });
  });

  describe('Key Activation and Switching', () => {
    it('should activate a specific key', async () => {
      const manager = await getManager();
      const key1 = await (manager as any).addKeyDirect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN1', 'Key 1');
      await (manager as any).addKeyDirect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN2', 'Key 2');
      
      const result = manager.activateKey(key1.keyId!);
      expect(result.success).toBe(true);
      const activeKey = manager.getActiveKey();
      expect(activeKey?.keyId).toBe(key1.keyId);
    });

    it('should fail when activating non-existent key', async () => {
      const manager = await getManager();
      const result = manager.activateKey('non_existent_id');
      expect(result.success).toBe(false);
    });
  });

  describe('Quota Tracking', () => {
    it('should track quota usage correctly', async () => {
      const manager = await getManager();
      const result = await (manager as any).addKeyDirect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y', 'Test Key');
      manager.markKeyUsed(result.keyId!);
      manager.markKeyUsed(result.keyId!);
      manager.markKeyUsed(result.keyId!);
      const keys = manager.getKeys();
      expect(keys[0].quotaUsed).toBe(3);
    });

    it('should update quota information', async () => {
      const manager = await getManager();
      const result = await (manager as any).addKeyDirect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y', 'Test Key');
      manager.updateQuota(result.keyId!, 5000);
      const keys = manager.getKeys();
      expect(keys[0].quotaUsed).toBe(5000);
    });
  });

  describe('Failover Logic', () => {
    it('should get next available key when current is exhausted', async () => {
      const manager = await getManager();
      const key1 = await (manager as any).addKeyDirect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN1', 'Key 1');
      const key2 = await (manager as any).addKeyDirect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN2', 'Key 2');
      manager.updateQuota(key1.keyId!, 10000);
      const nextKey = manager.getNextAvailableKey();
      expect(nextKey).toBeDefined();
      expect(nextKey?.keyId).toBe(key2.keyId);
    });

    it('should return null when all keys are exhausted', async () => {
      const manager = await getManager();
      const key1 = await (manager as any).addKeyDirect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN1', 'Key 1');
      const key2 = await (manager as any).addKeyDirect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN2', 'Key 2');
      manager.updateQuota(key1.keyId!, 10000);
      manager.updateQuota(key2.keyId!, 10000);
      const nextKey = manager.getNextAvailableKey();
      expect(nextKey).toBeNull();
    });

    it('should return current active key if it still has quota', async () => {
      const manager = await getManager();
      const key1 = await (manager as any).addKeyDirect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN1', 'Key 1');
      const key2 = await (manager as any).addKeyDirect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN2', 'Key 2');
      manager.activateKey(key2.keyId!);
      const nextKey = manager.getNextAvailableKey();
      expect(nextKey?.keyId).toBe(key2.keyId);
    });
  });

  describe('Error Handling', () => {
    it('should record errors for a key', async () => {
      const manager = await getManager();
      const result = await (manager as any).addKeyDirect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y', 'Test Key');
      manager.recordError(result.keyId!, 'Quota exceeded');
      manager.recordError(result.keyId!, 'Rate limited');
      const keys = manager.getKeys();
      expect(keys[0].errorCount).toBe(2);
      expect(keys[0].lastError).toBe('Rate limited');
    });

    it('should auto-deactivate key after too many errors', async () => {
      const manager = await getManager();
      const result = await (manager as any).addKeyDirect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y', 'Test Key');
      for (let i = 0; i < 5; i++) {
        manager.recordError(result.keyId!, `Error ${i}`);
      }
      const keys = manager.getKeys();
      expect(keys[0].isValidated).toBe(false);
    });

    it('should clear errors after successful operation', async () => {
      const manager = await getManager();
      const result = await (manager as any).addKeyDirect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y', 'Test Key');
      manager.recordError(result.keyId!, 'Some error');
      manager.clearErrors(result.keyId!);
      const keys = manager.getKeys();
      expect(keys[0].errorCount).toBe(0);
      expect(keys[0].lastError).toBeNull();
    });
  });

  describe('Integrity Checks', () => {
    it('should pass integrity check with valid state', async () => {
      const manager = await getManager();
      await (manager as any).addKeyDirect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y', 'Test Key');
      const integrity = manager.runIntegrityCheck();
      expect(integrity.isHealthy).toBe(true);
      expect(integrity.issues).toHaveLength(0);
    });

    it('should fail integrity check when no keys are configured', async () => {
      const manager = await getManager();
      manager.clearAllKeys();
      const integrity = manager.runIntegrityCheck();
      expect(integrity.isHealthy).toBe(false);
      expect(integrity.issues).toContain('No API keys configured');
    });

    it('should fail integrity check when all keys exhausted', async () => {
      const manager = await getManager();
      const result = await (manager as any).addKeyDirect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y', 'Test Key');
      manager.updateQuota(result.keyId!, 10000);
      const integrity = manager.runIntegrityCheck();
      expect(integrity.isHealthy).toBe(false);
      expect(integrity.issues.some((i: string) => i.includes('exceeded quota'))).toBe(true);
    });
  });

  describe('Quota Error Detection', () => {
    it('should correctly identify quota errors', async () => {
      const { GoogleApiKeyManager } = await import('../../src/services/googleApiKeyManager');
      expect(GoogleApiKeyManager.isQuotaError({ message: '429 Too Many Requests' })).toBe(true);
      expect(GoogleApiKeyManager.isQuotaError({ message: 'RESOURCE_EXHAUSTED' })).toBe(true);
      expect(GoogleApiKeyManager.isQuotaError({ message: 'Quota exceeded' })).toBe(true);
      expect(GoogleApiKeyManager.isQuotaError({ message: 'Rate limit reached' })).toBe(true);
      expect(GoogleApiKeyManager.isQuotaError({ message: 'Network error' })).toBe(false);
    });
  });

  describe('Event System', () => {
    it('should emit events when keys are added', async () => {
      const manager = await getManager();
      let eventReceived = false;
      let receivedKeyId: string | undefined;
      const unsubscribe = manager.subscribe((event: any) => {
        if (event.type === 'key-added') {
          eventReceived = true;
          receivedKeyId = event.keyId;
        }
      });
      const result = await (manager as any).addKeyDirect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y', 'Test Key');
      expect(eventReceived).toBe(true);
      expect(receivedKeyId).toBe(result.keyId);
      unsubscribe();
    });

    it('should emit failover event when key is rotated', async () => {
      const manager = await getManager();
      const key1 = await (manager as any).addKeyDirect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN1', 'Key 1');
      const key2 = await (manager as any).addKeyDirect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN2', 'Key 2');
      manager.updateQuota(key1.keyId!, 10000);
      let failoverEventReceived = false;
      const unsubscribe = manager.subscribe((event: any) => {
        if (event.type === 'failover-triggered') {
          failoverEventReceived = true;
        }
      });
      manager.getNextAvailableKey();
      expect(failoverEventReceived).toBe(true);
      unsubscribe();
    });

    it('should allow unsubscribing from events', async () => {
      const manager = await getManager();
      let eventCount = 0;
      const unsubscribe = manager.subscribe((event: any) => {
        if (event.type === 'key-added') {
          eventCount++;
        }
      });
      unsubscribe();
      await (manager as any).addKeyDirect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y', 'Test Key');
      expect(eventCount).toBe(0);
    });
  });

  describe('Key Preview (Security)', () => {
    it('should only expose partial key in getKeys', async () => {
      const manager = await getManager();
      await (manager as any).addKeyDirect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y', 'Test Key');
      const keys = manager.getKeys();
      expect(keys[0].key).toContain('...');
      expect(keys[0].key).not.toContain('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y');
    });

    it('should expose full key only in getActiveKey and getAllKeys', async () => {
      const manager = await getManager();
      await (manager as any).addKeyDirect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y', 'Test Key');
      const activeKey = manager.getActiveKey();
      expect(activeKey?.key).toBe('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y');
      const allKeys = manager.getAllKeys();
      expect(allKeys[0].key).toBe('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y');
    });
  });
});
