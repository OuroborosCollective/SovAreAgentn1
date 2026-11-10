import type { PersonaState } from '../hooks/useChildPersona';

/**
 * Retired legacy adapter. N+1 must never send personal-family persona data to
 * the old Firebase tenant implicitly. A future canonical PostgreSQL sync must
 * use authenticated server routes, explicit consent, and durable readback.
 * Keep these exports until callers can migrate without assuming fake success.
 */
export async function testFirestoreConnection(): Promise<boolean> {
  return false;
}

export async function syncPersonaToCloud(_nodeId: string, _personaState: PersonaState): Promise<boolean> {
  return false;
}

export async function fetchPersonaFromCloud(_nodeId: string): Promise<PersonaState | null> {
  return null;
}
