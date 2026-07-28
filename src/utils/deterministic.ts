let globalSequence = 0;
const baseEpoch = 1722000000000;

// Simple Linear Congruential Generator (LCG) for pure deterministic pseudo-randomness without performance.now tricks
class DeterministicPRNG {
  private seed: number;

  constructor(seed: number = 42) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  public next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
}

const defaultPrng = new DeterministicPRNG(1337);

export const generateDeterministicId = (prefix: string = 'id'): string => {
  globalSequence++;
  return `${prefix}-det-${globalSequence}-${Math.floor(defaultPrng.next() * 100000)}`;
};

export const generateDeterministicNumber = (min: number, max: number, seed?: number): number => {
  const prng = seed !== undefined ? new DeterministicPRNG(Math.floor(seed * 9999)) : defaultPrng;
  const val = prng.next();
  return min + val * (max - min);
};

export const getDeterministicTimestamp = (): string => {
  globalSequence++;
  const simulatedTime = baseEpoch + (globalSequence * 1500);
  return new Date(simulatedTime).toLocaleTimeString();
};

export const getDeterministicTimestampMs = (): number => {
  globalSequence++;
  return baseEpoch + (globalSequence * 1500);
};
