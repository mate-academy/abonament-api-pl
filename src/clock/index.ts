// Czas dla testowalności: kod bierze bieżący moment tylko z clock.now().
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };

export function fixedClock(at: Date): Clock {
  return { now: () => new Date(at.getTime()) };
}

// CLOCK_FIXED_NOW (ciąg ISO) ustala czas w lokalnym środowisku testowym.
export function clockFromEnv(value = process.env.CLOCK_FIXED_NOW): Clock {
  if (!value) return systemClock;
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) throw new Error(`CLOCK_FIXED_NOW is not a date: ${value}`);
  return fixedClock(at);
}
