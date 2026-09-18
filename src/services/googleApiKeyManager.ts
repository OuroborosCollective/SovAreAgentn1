/**
 * Google AI Studio API Key Manager
 * 
 * Manages multiple Google AI Studio API keys for the Gemini voice/TTS service.
 * Features:
 * - Multiple key storage with validation
 * - Automatic quota tracking and failover
 * - Runtime checks for key integrity
 * - Secure key handling
 */

import { GoogleGenAI } from "@google/genai";

export interface ApiKeyInfo {
  id: string;
  key: string;
  label: string;
  isActive: boolean;
  quotaUsed: number;
  quotaLimit: number;
  lastUsed: number | null;
  lastError: string | null;
  errorCount: number;
  createdAt: number;
  isValidated: boolean;
}

export interface QuotaExceededError {
  type: 'QUOTA_EXCEEDED';
  keyId: string;
  message: string;
}

export interface KeyValidationResult {
  isValid: boolean;
  keyId?: string;
  error?: string;
  quotaInfo?: {
    used: number;
    limit: number;
  };
}

// Event types for key manager updates
export type KeyManagerEventType = 
  | 'key-added' 
  | 'key-removed' 
  | 'key-activated' 
  | 'key-deactivated'
  | 'quota-updated'
  | 'failover-triggered'
  | 'all-keys-exhausted';

export interface KeyManagerEvent {
  type: KeyManagerEventType;
  keyId?: string;
  timestamp: number;
  details?: any;
}

type KeyManagerListener = (event: KeyManagerEvent) => void;

const STORAGE_KEY = 'n1_google_api_keys';
const DEFAULT_QUOTA_LIMIT = 10000; // Google AI Studio free tier default
const MAX_KEYS = 10;
const MIN_KEY_LENGTH = 20;
const MAX_KEY_LENGTH = 100;

export class GoogleApiKeyManager {
  private static instance: GoogleApiKeyManager | null = null;
  private keys: Map<string, ApiKeyInfo> = new Map();
  private activeKeyId: string | null = null;
  private listeners: Set<KeyManagerListener> = new Set();
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): GoogleApiKeyManager {
    if (!GoogleApiKeyManager.instance) {
      GoogleApiKeyManager.instance = new GoogleApiKeyManager();
      GoogleApiKeyManager.instance.initializationPromise = GoogleApiKeyManager.instance.loadFromStorage();
    }
    return GoogleApiKeyManager.instance;
  }

  /**
   * Reset the singleton instance - FOR TESTING ONLY
   */
  public static resetInstance(): void {
    GoogleApiKeyManager.instance = null;
  }

  /**
   * Initialize and load keys from storage
   */
  private async loadFromStorage(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.keys = new Map(Object.entries(data.keys || {}));
        this.activeKeyId = data.activeKeyId || null;
      }
    } catch (error) {
      console.error('[GoogleApiKeyManager] Failed to load from storage:', error);
    }
  }

  /**
   * Wait for initialization to complete
   */
  public async waitForInitialization(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  /**
   * Persist keys to storage
   */
  private persistToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const data = {
        keys: Object.fromEntries(this.keys),
        activeKeyId: this.activeKeyId
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[GoogleApiKeyManager] Failed to persist to storage:', error);
    }
  }

  /**
   * Emit an event to all listeners
   */
  private emit(type: KeyManagerEventType, keyId?: string, details?: any): void {
    const event: KeyManagerEvent = {
      type,
      keyId,
      timestamp: Date.now(),
      details
    };
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[GoogleApiKeyManager] Listener error:', error);
      }
    });
  }

  /**
   * Subscribe to key manager events
   */
  public subscribe(listener: KeyManagerListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Validate API key format (basic validation)
   */
  public validateKeyFormat(key: string): { isValid: boolean; error?: string } {
    if (!key || typeof key !== 'string') {
      return { isValid: false, error: 'API key must be a non-empty string' };
    }

    const trimmed = key.trim();
    
    if (trimmed.length < MIN_KEY_LENGTH) {
      return { isValid: false, error: `API key is too short (minimum ${MIN_KEY_LENGTH} characters)` };
    }

    if (trimmed.length > MAX_KEY_LENGTH) {
      return { isValid: false, error: `API key is too long (maximum ${MAX_KEY_LENGTH} characters)` };
    }

    // Google API keys typically start with "AIza"
    if (!trimmed.startsWith('AIza')) {
      return { isValid: false, error: 'API key format appears invalid (should start with AIza)' };
    }

    return { isValid: true };
  }

  /**
   * Validate key by attempting an API call
   */
  public async validateKey(key: string): Promise<KeyValidationResult> {
    const formatCheck = this.validateKeyFormat(key);
    if (!formatCheck.isValid) {
      return { isValid: false, error: formatCheck.error };
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });

      // Simple validation: try to list models (lightweight API call)
      const response = await ai.models.list();
      
      if (response) {
        return { 
          isValid: true,
          quotaInfo: { used: 0, limit: DEFAULT_QUOTA_LIMIT }
        };
      }

      return { isValid: false, error: 'Invalid API response' };
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      
      // Check for quota errors
      if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('quota')) {
        return { 
          isValid: true,
          error: 'Key is valid but quota appears to be exceeded',
          quotaInfo: { used: DEFAULT_QUOTA_LIMIT, limit: DEFAULT_QUOTA_LIMIT }
        };
      }

      // Check for invalid key
      if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('INVALID_ARGUMENT')) {
        return { isValid: false, error: 'API key is invalid' };
      }

      return { isValid: false, error: `Validation failed: ${errorMsg}` };
    }
  }

  /**
   * Add a new API key
   */
  public async addKey(key: string, label?: string): Promise<{ success: boolean; keyId?: string; error?: string }> {
    // Runtime checks
    if (this.keys.size >= MAX_KEYS) {
      return { success: false, error: `Maximum number of keys (${MAX_KEYS}) reached` };
    }

    const formatCheck = this.validateKeyFormat(key);
    if (!formatCheck.isValid) {
      return { success: false, error: formatCheck.error };
    }

    // Check for duplicate keys
    for (const [id, info] of this.keys) {
      if (info.key === key) {
        return { success: false, error: 'This API key is already registered' };
      }
    }

    // Validate the key with the API
    const validation = await this.validateKey(key);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const keyId = `key_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const keyInfo: ApiKeyInfo = {
      id: keyId,
      key: key.trim(),
      label: label || `Key ${this.keys.size + 1}`,
      isActive: this.keys.size === 0, // First key becomes active
      quotaUsed: validation.quotaInfo?.used || 0,
      quotaLimit: validation.quotaInfo?.limit || DEFAULT_QUOTA_LIMIT,
      lastUsed: null,
      lastError: validation.error || null,
      errorCount: validation.error ? 1 : 0,
      createdAt: Date.now(),
      isValidated: true
    };

    this.keys.set(keyId, keyInfo);
    
    if (keyInfo.isActive) {
      this.activeKeyId = keyId;
    }

    this.persistToStorage();
    this.emit('key-added', keyId, { label: keyInfo.label });

    return { success: true, keyId };
  }

  /**
   * Remove an API key
   */
  public removeKey(keyId: string): { success: boolean; error?: string } {
    if (!this.keys.has(keyId)) {
      return { success: false, error: 'Key not found' };
    }

    const keyInfo = this.keys.get(keyId)!;
    const wasActive = keyInfo.isActive;
    
    this.keys.delete(keyId);
    
    // If removed key was active, activate another key
    if (wasActive && this.keys.size > 0) {
      const firstKey = this.keys.values().next().value;
      if (firstKey) {
        this.activateKey(firstKey.id);
      }
    } else if (this.keys.size === 0) {
      this.activeKeyId = null;
    }

    this.persistToStorage();
    this.emit('key-removed', keyId);

    return { success: true };
  }

  /**
   * Add a key directly without API validation (for internal/testing use)
   */
  public addKeyDirect(key: string, label?: string): { success: boolean; keyId?: string; error?: string } {
    // Runtime checks
    if (this.keys.size >= MAX_KEYS) {
      return { success: false, error: `Maximum number of keys (${MAX_KEYS}) reached` };
    }

    const formatCheck = this.validateKeyFormat(key);
    if (!formatCheck.isValid) {
      return { success: false, error: formatCheck.error };
    }

    // Check for duplicate keys
    for (const [id, info] of this.keys) {
      if (info.key === key) {
        return { success: false, error: 'This API key is already registered' };
      }
    }

    const keyId = `key_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const keyInfo: ApiKeyInfo = {
      id: keyId,
      key: key.trim(),
      label: label || `Key ${this.keys.size + 1}`,
      isActive: this.keys.size === 0,
      quotaUsed: 0,
      quotaLimit: DEFAULT_QUOTA_LIMIT,
      lastUsed: null,
      lastError: null,
      errorCount: 0,
      createdAt: Date.now(),
      isValidated: true
    };

    this.keys.set(keyId, keyInfo);
    
    if (keyInfo.isActive) {
      this.activeKeyId = keyId;
    }

    this.persistToStorage();
    this.emit('key-added', keyId, { label: keyInfo.label });

    return { success: true, keyId };
  }

  /**
   * Get all keys (without exposing full key values)
   */
  public getKeys(): Omit<ApiKeyInfo, 'key'>[] {
    return Array.from(this.keys.values()).map(k => ({
      id: k.id,
      key: k.key.substring(0, 8) + '...' + k.key.substring(k.key.length - 4),
      label: k.label,
      isActive: k.isActive,
      quotaUsed: k.quotaUsed,
      quotaLimit: k.quotaLimit,
      lastUsed: k.lastUsed,
      lastError: k.lastError,
      errorCount: k.errorCount,
      createdAt: k.createdAt,
      isValidated: k.isValidated
    }));
  }

  /**
   * Get the currently active API key
   */
  public getActiveKey(): { key: string; keyId: string } | null {
    if (!this.activeKeyId) return null;
    
    const activeKey = this.keys.get(this.activeKeyId);
    if (!activeKey) return null;

    return {
      key: activeKey.key,
      keyId: activeKey.id
    };
  }

  /**
   * Get all available keys for iteration
   */
  public getAllKeys(): Array<{ key: string; keyId: string }> {
    return Array.from(this.keys.values())
      .filter(k => k.isValidated && k.errorCount < 5)
      .map(k => ({ key: k.key, keyId: k.id }));
  }

  /**
   * Activate a specific key
   */
  public activateKey(keyId: string): { success: boolean; error?: string } {
    if (!this.keys.has(keyId)) {
      return { success: false, error: 'Key not found' };
    }

    // Deactivate all keys
    for (const [id, info] of this.keys) {
      info.isActive = id === keyId;
    }

    this.activeKeyId = keyId;
    this.persistToStorage();
    this.emit('key-activated', keyId);

    return { success: true };
  }

  /**
   * Update quota information for a key
   */
  public updateQuota(keyId: string, used: number): void {
    const key = this.keys.get(keyId);
    if (!key) return;

    key.quotaUsed = used;
    this.persistToStorage();
    this.emit('quota-updated', keyId, { used, limit: key.quotaLimit });
  }

  /**
   * Record an error for a key
   */
  public recordError(keyId: string, error: string): void {
    const key = this.keys.get(keyId);
    if (!key) return;

    key.lastError = error;
    key.errorCount++;

    // Auto-deactivate key after too many errors
    if (key.errorCount >= 5) {
      console.warn(`[GoogleApiKeyManager] Key ${keyId} deactivated due to multiple errors`);
      key.isValidated = false;
      this.emit('key-deactivated', keyId, { reason: 'error_threshold' });
    }

    this.persistToStorage();
  }

  /**
   * Clear error count for a key (e.g., after successful call)
   */
  public clearErrors(keyId: string): void {
    const key = this.keys.get(keyId);
    if (!key) return;

    key.errorCount = 0;
    key.lastError = null;
    key.isValidated = true;
    this.persistToStorage();
  }

  /**
   * Mark a key as used
   */
  public markKeyUsed(keyId: string): void {
    const key = this.keys.get(keyId);
    if (!key) return;

    key.lastUsed = Date.now();
    key.quotaUsed++;
    this.persistToStorage();
  }

  /**
   * Get the next available key after current one hits quota
   */
  public getNextAvailableKey(): { key: string; keyId: string } | null {
    if (this.keys.size === 0) return null;

    const availableKeys = Array.from(this.keys.values())
      .filter(k => k.isValidated && k.errorCount < 5 && k.quotaUsed < k.quotaLimit)
      .sort((a, b) => {
        // Prefer keys with lower usage
        const usageA = a.quotaUsed / a.quotaLimit;
        const usageB = b.quotaUsed / b.quotaLimit;
        return usageA - usageB;
      });

    if (availableKeys.length === 0) {
      this.emit('all-keys-exhausted');
      return null;
    }

    // If current active key still has quota, return it
    const currentActive = this.getActiveKey();
    if (currentActive) {
      const currentKey = this.keys.get(currentActive.keyId);
      if (currentKey && currentKey.quotaUsed < currentKey.quotaLimit && currentKey.errorCount < 5) {
        return currentActive;
      }
    }

    // Return the key with lowest usage
    const nextKey = availableKeys[0];
    this.activateKey(nextKey.id);
    this.emit('failover-triggered', nextKey.id, { reason: 'quota_exceeded' });

    return { key: nextKey.key, keyId: nextKey.id };
  }

  /**
   * Check if a specific error indicates quota exceeded
   */
  public static isQuotaError(error: any): boolean {
    const msg = (error?.message || String(error)).toLowerCase();
    return msg.includes('429') || 
           msg.includes('resource_exhausted') || 
           msg.includes('quota') ||
           msg.includes('rate limit') ||
           msg.includes('rate_limit');
  }

  /**
   * Runtime integrity check
   */
  public runIntegrityCheck(): { isHealthy: boolean; issues: string[] } {
    const issues: string[] = [];

    if (this.keys.size === 0) {
      issues.push('No API keys configured');
    }

    const activeKeys = Array.from(this.keys.values()).filter(k => k.isActive);
    if (activeKeys.length === 0 && this.keys.size > 0) {
      issues.push('No active key selected');
    } else if (activeKeys.length > 1) {
      issues.push('Multiple keys marked as active');
    }

    const invalidKeys = Array.from(this.keys.values()).filter(k => !k.isValidated);
    if (invalidKeys.length > 0) {
      issues.push(`${invalidKeys.length} key(s) failed validation`);
    }

    const exhaustedKeys = Array.from(this.keys.values())
      .filter(k => k.quotaUsed >= k.quotaLimit);
    if (exhaustedKeys.length === this.keys.size && this.keys.size > 0) {
      issues.push('All keys have exceeded quota');
    }

    return {
      isHealthy: issues.length === 0,
      issues
    };
  }

  /**
   * Clear all keys
   */
  public clearAllKeys(): void {
    this.keys.clear();
    this.activeKeyId = null;
    this.persistToStorage();
    this.emit('key-removed');
  }
}

// Singleton export
export const googleApiKeyManager = GoogleApiKeyManager.getInstance();
