import { describe, expect, it } from 'vitest';
import {
  FAMILY_STORY,
  createFamilyHomeState,
  familyHomeReducer,
  getFamilyAddress,
  getPlayPrompt,
  presentationFor,
} from '../../src/domain/familyHomeCore';

describe('N+1 Familien-Zuhause (reiner Vertragskern; keine Produktions-Evidence)', () => {
  it('beginnt ohne erfundene Familien-Identitaet, Erinnerungen oder Lernerlebnisse', () => {
    const state = createFamilyHomeState();
    expect(state.speaker).toBe('guest');
    expect(state.room).toBe('wohnzimmer');
    expect(state.playTurns).toBe(0);
    expect(state.confirmedLearningCount).toBeNull();
    expect(getFamilyAddress(state.speaker)).toBe('du');
  });

  it('eine selbst gewaehlte Anrede ist keine Sprecherverifikation', () => {
    const state = familyHomeReducer(createFamilyHomeState(), { type: 'select-speaker', speaker: 'mama' });
    expect(getFamilyAddress(state.speaker)).toBe('Mama');
    expect(state.speakerVerified).toBe(false);
    expect(state.confirmedLearningCount).toBeNull();
  });

  it('Spielen ist deterministisch, begrenzt und kein Gedaechtnis-Receipt', () => {
    const initial = createFamilyHomeState();
    const a = familyHomeReducer(initial, { type: 'play' });
    const b = familyHomeReducer(initial, { type: 'play' });
    expect(a).toEqual(b);
    expect(a.playTurns).toBe(1);
    expect(getPlayPrompt(a)).toBe(getPlayPrompt(b));
    expect(a.confirmedLearningCount).toBeNull();
    expect(familyHomeReducer(a, { type: 'play' }).playTurns).toBe(2);
    expect(familyHomeReducer({ ...a, playTurns: 5000 }, { type: 'play' }).playTurns).toBe(5000);
  });

  it('Raumwechsel und Sprachstatus sind eigene, begrenzte Zustaende', () => {
    const a = familyHomeReducer(createFamilyHomeState(), { type: 'visit', room: 'leseecke' });
    expect(a.room).toBe('leseecke');
    expect(presentationFor(a).emotion).toBe('ruhig');
    const b = familyHomeReducer(a, { type: 'voice-failed' });
    expect(b.voiceStatus).toBe('error');
    expect(b.confirmedLearningCount).toBeNull();
  });

  it('Originalgeschichte hat Herkunft und gibt kein erfundenes Erlebnis vor', () => {
    expect(FAMILY_STORY.source).toBe('original');
    expect(FAMILY_STORY.text.length).toBeGreaterThan(100);
    expect(FAMILY_STORY.text).not.toMatch(/habe ich gestern erlebt|erinnere mich an gestern/i);
  });
});