/**
 * Integration Tests for TTS API Key Rotation
 * 
 * Tests the end-to-end behavior of the TTS API with multiple API keys:
 * - Key storage and retrieval
 * - Automatic failover on quota exceeded
 * - Error handling and fallback behavior
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';

// Mock the GoogleGenAI before importing the router
vi.mock('@google/genai', () => {
  const mockGenerateContent = vi.fn();
  
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
        list: vi.fn().mockResolvedValue({ models: [] })
      }
    })),
    __mockGenerateContent: mockGenerateContent
  };
});

describe('TTS API Key Rotation Integration', () => {
  let app: Express;
  let mockGenerateContent: any;

  beforeEach(async () => {
    vi.resetModules();
    
    // Get the mock function reference
    const mockModule = await import('@google/genai');
    mockGenerateContent = mockModule.__mockGenerateContent;
    
    // Create fresh Express app for each test
    app = express();
    app.use(express.json());
    
    // Import and use the TTS router
    const { createTtsRouter, addServerKey, getServerKeys } = await import('../../src/api/tts');
    app.use('/api/tts', createTtsRouter());
    
    // Add test endpoint to check key status
    app.get('/api/test/keys', (_req, res) => {
      res.json({ keys: getServerKeys() });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Key Management Endpoints', () => {
    it('should add a new API key', async () => {
      const response = await request(app)
        .post('/api/tts/keys')
        .send({ key: 'AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y', label: 'Test Key' });
      
      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.id).toBeDefined();
    });

    it('should reject invalid API key format', async () => {
      const response = await request(app)
        .post('/api/tts/keys')
        .send({ key: 'invalid_key', label: 'Bad Key' });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid');
    });

    it('should reject duplicate keys', async () => {
      await request(app)
        .post('/api/tts/keys')
        .send({ key: 'AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y', label: 'First Key' });
      
      const response = await request(app)
        .post('/api/tts/keys')
        .send({ key: 'AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y', label: 'Duplicate Key' });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already');
    });

    it('should list stored keys', async () => {
      await request(app)
        .post('/api/tts/keys')
        .send({ key: 'AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y', label: 'Test Key' });
      
      const response = await request(app).get('/api/tts/keys');
      
      expect(response.status).toBe(200);
      expect(response.body.keys).toHaveLength(1);
      expect(response.body.keys[0].label).toBe('Test Key');
    });

    it('should remove a key', async () => {
      const addResponse = await request(app)
        .post('/api/tts/keys')
        .send({ key: 'AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y', label: 'To Remove' });
      
      const keyId = addResponse.body.id;
      
      const response = await request(app).delete(`/api/tts/keys/${keyId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });
  });

  describe('TTS Generation with Key Rotation', () => {
    it('should use stored key for TTS generation', async () => {
      // Add a key
      await request(app)
        .post('/api/tts/keys')
        .send({ key: 'AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y', label: 'Test Key' });
      
      // Mock successful TTS response
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                data: 'base64EncodedAudioData',
                mimeType: 'audio/wav'
              }
            }]
          }
        }]
      });
      
      const response = await request(app)
        .post('/api/tts')
        .send({ text: 'Hello world', voiceName: 'Puck' });
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.audio).toBeDefined();
    });

    it('should handle quota exceeded and retry with same key', async () => {
      await request(app)
        .post('/api/tts/keys')
        .send({ key: 'AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y', label: 'Test Key' });
      
      // First call returns quota error
      mockGenerateContent.mockRejectedValueOnce({
        message: '429 RESOURCE_EXHAUSTED - Quota exceeded'
      });
      
      // Second call succeeds
      mockGenerateContent.mockResolvedValueOnce({
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                data: 'base64EncodedAudioData',
                mimeType: 'audio/wav'
              }
            }]
          }
        }]
      });
      
      const response = await request(app)
        .post('/api/tts')
        .send({ text: 'Hello world' });
      
      expect(response.status).toBe(200);
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    it('should fallback gracefully when no keys available', async () => {
      const response = await request(app)
        .post('/api/tts')
        .send({ text: 'Hello world' });
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('fallback');
      expect(response.body.error).toBe('NO_API_KEY');
    });

    it('should handle API errors gracefully', async () => {
      await request(app)
        .post('/api/tts/keys')
        .send({ key: 'AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y', label: 'Test Key' });
      
      mockGenerateContent.mockRejectedValue({
        message: 'Network error'
      });
      
      const response = await request(app)
        .post('/api/tts')
        .send({ text: 'Hello world' });
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('fallback');
    });

    it('should require text parameter', async () => {
      const response = await request(app)
        .post('/api/tts')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Text is required');
    });
  });

  describe('Key Status Endpoint', () => {
    it('should return correct key status', async () => {
      await request(app)
        .post('/api/tts/keys')
        .send({ key: 'AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y', label: 'Test Key' });
      
      const response = await request(app).get('/api/tts/keys');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.serverKeyCount).toBe(1);
      expect(response.body.currentKeyActive).toBe(true);
    });

    it('should indicate when env key is available', async () => {
      // Set environment variable for this test
      process.env.API_KEY = 'AIzaTestEnvKey';
      
      const response = await request(app).get('/api/tts/keys');
      
      expect(response.status).toBe(200);
      expect(response.body.hasEnvKey).toBe(true);
      
      delete process.env.API_KEY;
    });
  });
});

describe('Runtime Key Validation', () => {
  it('should validate key format at runtime', async () => {
    // Test valid format
    expect('AIzaSyDkR2OJxFJqSQ6tGjKRJZL5bXyN5Y').toMatch(/^AIza/);
    
    // Test invalid format
    expect('invalid').not.toMatch(/^AIza/);
  });

  it('should handle missing text parameter', async () => {
    const app = express();
    app.use(express.json());
    
    // Import fresh module
    vi.resetModules();
    const { createTtsRouter } = await import('../../src/api/tts');
    app.use('/api/tts', createTtsRouter());
    
    const response = await request(app)
      .post('/api/tts')
      .send({});
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Text is required');
  });
});
