import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fetchPersonaFromCloud, syncPersonaToCloud, testFirestoreConnection } from '../../src/services/firebasePersonaSync';
import { personaEvolutionService } from '../../src/services/personaEvolutionService';
import type { PersonaState } from '../../src/hooks/useChildPersona';
import type { PersonaEvolutionMetrics } from '../../src/services/personaEvolutionService';

afterEach(() => vi.unstubAllGlobals());

describe('retired Firebase legacy boundary: no undocumented family data egress', () => {
  it('does not ship the retired Firebase SDK in the application dependency graph', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(pkg.dependencies.firebase).toBeUndefined();
    expect(readFileSync('src/services/firebasePersonaSync.ts', 'utf8')).not.toMatch(/from\s+['"]firebase\//);
  });

  it('fails closed instead of attempting remote family persona writes or claiming success', async () => {
    const outbound = vi.fn(() => Promise.reject(new Error('Unexpected outbound request')));
    vi.stubGlobal('fetch', outbound);
    expect(await testFirestoreConnection()).toBe(false);
    expect(await syncPersonaToCloud('example-node', {} as PersonaState)).toBe(false);
    expect(await fetchPersonaFromCloud('example-node')).toBeNull();
    expect(outbound).not.toHaveBeenCalled();
  });

  it('does not invent durable personality evolution receipts', async () => {
    const outbound = vi.fn(() => Promise.reject(new Error('Unexpected outbound request')));
    vi.stubGlobal('fetch', outbound);
    expect(await personaEvolutionService.persistEvolutionSnapshot({} as PersonaEvolutionMetrics)).toBe(false);
    expect(outbound).not.toHaveBeenCalled();
  });
});
