/**
 * Google AI Studio API Key Management Router
 * 
 * Server-side API endpoints for managing Google AI Studio API keys.
 * Provides secure CRUD operations for key management.
 */

import { Router } from "express";
import crypto from "crypto";

const router = Router();

// In-memory store for server-side key management
// In production, this should be stored in a database
interface ServerKeyEntry {
  id: string;
  key: string; // Full key (encrypted in production)
  label: string;
  createdAt: number;
  lastUsed: number | null;
  usageCount: number;
  isActive: boolean;
}

const serverKeyStore: Map<string, ServerKeyEntry> = new Map();

// Secret for signing key IDs
const KEY_SIGNING_SECRET = process.env.N1_KEY_SIGNING_SECRET || crypto.randomBytes(32).toString('hex');

/**
 * Generate a signed key ID
 */
function signKeyId(keyId: string): string {
  const hmac = crypto.createHmac('sha256', KEY_SIGNING_SECRET);
  hmac.update(keyId);
  return `${keyId}.${hmac.digest('base64url').substring(0, 16)}`;
}

/**
 * Verify a signed key ID
 */
function verifySignedKeyId(signedKeyId: string): string | null {
  const parts = signedKeyId.split('.');
  if (parts.length !== 2) return null;
  
  const [keyId, signature] = parts;
  const hmac = crypto.createHmac('sha256', KEY_SIGNING_SECRET);
  hmac.update(keyId);
  const expectedSig = hmac.digest('base64url').substring(0, 16);
  
  if (signature !== expectedSig) return null;
  return keyId;
}

/**
 * GET /api/google-keys - List all stored keys (metadata only)
 */
router.get("/", (_req, res) => {
  const keys = Array.from(serverKeyStore.values()).map(k => ({
    id: signKeyId(k.id),
    label: k.label,
    createdAt: k.createdAt,
    lastUsed: k.lastUsed,
    usageCount: k.usageCount,
    isActive: k.isActive,
    keyPreview: k.key.substring(0, 8) + '...' + k.key.substring(k.key.length - 4)
  }));

  res.json({
    status: "success",
    count: keys.length,
    keys
  });
});

/**
 * POST /api/google-keys - Add a new API key
 */
router.post("/", async (req, res) => {
  try {
    const { key, label } = req.body;

    if (!key || typeof key !== 'string') {
      return res.status(400).json({
        status: "error",
        error: "API key is required"
      });
    }

    const trimmedKey = key.trim();

    // Validate key format
    if (!trimmedKey.startsWith('AIza')) {
      return res.status(400).json({
        status: "error",
        error: "Invalid API key format (should start with AIza)"
      });
    }

    if (trimmedKey.length < 20 || trimmedKey.length > 100) {
      return res.status(400).json({
        status: "error",
        error: "API key length is invalid"
      });
    }

    // Check for duplicates
    for (const [id, entry] of serverKeyStore) {
      if (entry.key === trimmedKey) {
        return res.status(409).json({
          status: "error",
          error: "This API key is already registered"
        });
      }
    }

    // Check max keys limit
    if (serverKeyStore.size >= 10) {
      return res.status(400).json({
        status: "error",
        error: "Maximum number of keys (10) reached"
      });
    }

    const keyId = crypto.randomUUID();
    const newKey: ServerKeyEntry = {
      id: keyId,
      key: trimmedKey,
      label: label || `Key ${serverKeyStore.size + 1}`,
      createdAt: Date.now(),
      lastUsed: null,
      usageCount: 0,
      isActive: serverKeyStore.size === 0
    };

    serverKeyStore.set(keyId, newKey);

    res.status(201).json({
      status: "success",
      keyId: signKeyId(keyId),
      message: "API key added successfully"
    });
  } catch (error: any) {
    console.error('[GoogleKeys API] Error adding key:', error);
    res.status(500).json({
      status: "error",
      error: "Failed to add API key"
    });
  }
});

/**
 * DELETE /api/google-keys/:signedKeyId - Remove an API key
 */
router.delete("/:signedKeyId", (req, res) => {
  try {
    const { signedKeyId } = req.params;
    const keyId = verifySignedKeyId(signedKeyId);

    if (!keyId) {
      return res.status(400).json({
        status: "error",
        error: "Invalid key ID"
      });
    }

    if (!serverKeyStore.has(keyId)) {
      return res.status(404).json({
        status: "error",
        error: "Key not found"
      });
    }

    serverKeyStore.delete(keyId);

    res.json({
      status: "success",
      message: "API key removed successfully"
    });
  } catch (error: any) {
    console.error('[GoogleKeys API] Error removing key:', error);
    res.status(500).json({
      status: "error",
      error: "Failed to remove API key"
    });
  }
});

/**
 * POST /api/google-keys/:signedKeyId/activate - Set key as active
 */
router.post("/:signedKeyId/activate", (req, res) => {
  try {
    const { signedKeyId } = req.params;
    const keyId = verifySignedKeyId(signedKeyId);

    if (!keyId) {
      return res.status(400).json({
        status: "error",
        error: "Invalid key ID"
      });
    }

    if (!serverKeyStore.has(keyId)) {
      return res.status(404).json({
        status: "error",
        error: "Key not found"
      });
    }

    // Deactivate all keys
    for (const [id, entry] of serverKeyStore) {
      entry.isActive = id === keyId;
    }

    res.json({
      status: "success",
      message: "API key activated"
    });
  } catch (error: any) {
    console.error('[GoogleKeys API] Error activating key:', error);
    res.status(500).json({
      status: "error",
      error: "Failed to activate API key"
    });
  }
});

/**
 * GET /api/google-keys/active - Get the currently active key
 */
router.get("/active", (_req, res) => {
  const activeKey = Array.from(serverKeyStore.values()).find(k => k.isActive);

  if (!activeKey) {
    return res.json({
      status: "success",
      hasActiveKey: false,
      key: null
    });
  }

  res.json({
    status: "success",
    hasActiveKey: true,
    keyId: signKeyId(activeKey.id),
    label: activeKey.label,
    usageCount: activeKey.usageCount
  });
});

/**
 * POST /api/google-keys/rotate - Get the next available key (for quota failover)
 */
router.post("/rotate", (_req, res) => {
  try {
    const availableKeys = Array.from(serverKeyStore.values())
      .filter(k => k.usageCount < 10000) // Simple quota check
      .sort((a, b) => a.usageCount - b.usageCount);

    if (availableKeys.length === 0) {
      return res.status(503).json({
        status: "error",
        error: "No available keys - all keys exhausted",
        allKeysExhausted: true
      });
    }

    const nextKey = availableKeys[0];

    // Deactivate all and activate the selected one
    for (const [id, entry] of serverKeyStore) {
      entry.isActive = id === nextKey.id;
    }

    res.json({
      status: "success",
      rotated: true,
      keyId: signKeyId(nextKey.id),
      label: nextKey.label,
      key: nextKey.key // Full key for TTS usage
    });
  } catch (error: any) {
    console.error('[GoogleKeys API] Error rotating key:', error);
    res.status(500).json({
      status: "error",
      error: "Failed to rotate API key"
    });
  }
});

/**
 * POST /api/google-keys/record-usage - Record usage for a key
 */
router.post("/record-usage", (req, res) => {
  try {
    const { keyId } = req.body;

    if (!keyId) {
      return res.status(400).json({
        status: "error",
        error: "keyId is required"
      });
    }

    const actualKeyId = verifySignedKeyId(keyId);
    if (!actualKeyId) {
      return res.status(400).json({
        status: "error",
        error: "Invalid key ID"
      });
    }

    const keyEntry = serverKeyStore.get(actualKeyId);
    if (!keyEntry) {
      return res.status(404).json({
        status: "error",
        error: "Key not found"
      });
    }

    keyEntry.usageCount++;
    keyEntry.lastUsed = Date.now();

    res.json({
      status: "success",
      keyId: signKeyId(actualKeyId),
      usageCount: keyEntry.usageCount
    });
  } catch (error: any) {
    console.error('[GoogleKeys API] Error recording usage:', error);
    res.status(500).json({
      status: "error",
      error: "Failed to record usage"
    });
  }
});

/**
 * POST /api/google-keys/check - Check which key should be used (for TTS service)
 */
router.post("/check", (req, res) => {
  try {
    const { currentKeyId } = req.body;

    let currentKey: ServerKeyEntry | undefined;
    if (currentKeyId) {
      const actualKeyId = verifySignedKeyId(currentKeyId);
      if (actualKeyId) {
        currentKey = serverKeyStore.get(actualKeyId);
      }
    }

    // Check if current key is still viable
    if (currentKey && currentKey.usageCount < 10000) {
      return res.json({
        status: "success",
        shouldRotate: false,
        keyId: signKeyId(currentKey.id),
        key: currentKey.key,
        usageCount: currentKey.usageCount
      });
    }

    // Need to rotate
    const availableKeys = Array.from(serverKeyStore.values())
      .filter(k => k.usageCount < 10000)
      .sort((a, b) => a.usageCount - b.usageCount);

    if (availableKeys.length === 0) {
      return res.status(503).json({
        status: "error",
        error: "All keys exhausted",
        allKeysExhausted: true
      });
    }

    const nextKey = availableKeys[0];
    for (const [id, entry] of serverKeyStore) {
      entry.isActive = id === nextKey.id;
    }

    res.json({
      status: "success",
      shouldRotate: true,
      rotatedFrom: currentKeyId ? signKeyId(currentKey!.id) : null,
      keyId: signKeyId(nextKey.id),
      key: nextKey.key,
      usageCount: nextKey.usageCount
    });
  } catch (error: any) {
    console.error('[GoogleKeys API] Error checking key:', error);
    res.status(500).json({
      status: "error",
      error: "Failed to check API key status"
    });
  }
});

/**
 * POST /api/google-keys/clear-all - Remove all stored keys
 */
router.post("/clear-all", (_req, res) => {
  try {
    const count = serverKeyStore.size;
    serverKeyStore.clear();

    res.json({
      status: "success",
      message: `Removed ${count} API key(s)`
    });
  } catch (error: any) {
    console.error('[GoogleKeys API] Error clearing keys:', error);
    res.status(500).json({
      status: "error",
      error: "Failed to clear API keys"
    });
  }
});

export function createGoogleApiKeysRouter() {
  return router;
}
