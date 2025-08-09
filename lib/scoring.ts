
export type Substat = { stat: string; value: number };

// approximate max per-roll values for 5★ subs
const MAX_ROLL: Record<string, number> = {
  "CRIT Rate%": 3.9,
  "CRIT DMG%": 7.8,
  "ATK%": 5.8,
  "HP%": 5.8,
  "DEF%": 7.3,
  "ER%": 6.5,
  "EM": 23,
  "HP": 298.75,
  "ATK": 19.45,
  "DEF": 23.15
};

export function rollsEstimate(stat: string, value: number) {
  const m = MAX_ROLL[stat];
  if (!m) return value / 1; // unknown, just pass-through
  return value / m;
}

// Crit-focused RV: 2*CR + CD
export function critRV(subs: Substat[]): number {
  const cr = subs.find(s => s.stat === "CRIT Rate%")?.value ?? 0;
  const cd = subs.find(s => s.stat === "CRIT DMG%")?.value ?? 0;
  return 2 * cr + cd;
}

export function scoreArtifact(subs: Substat[]): number {
  // Simple composite: 70% RV, 20% ATK%/EM/ER, 10% others
  const rv = critRV(subs);
  const atk = subs.find(s => s.stat === "ATK%")?.value ?? 0;
  const em  = subs.find(s => s.stat === "EM")?.value ?? 0;
  const er  = subs.find(s => s.stat === "ER%")?.value ?? 0;
  const aux = atk * 0.5 + er * 0.3 + em * 0.05;
  return rv * 0.7 + aux;
}
