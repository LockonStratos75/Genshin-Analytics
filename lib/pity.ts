import type { Wish, Pity } from "./types";

export function computePity(wishes: Wish[]): Pity {
  const pity: Pity = { standard: 0, character: 0, weapon: 0 };
  let counters = { standard: 0, character: 0, weapon: 0 } as Record<'standard'|'character'|'weapon', number>;
  const sorted = [...wishes].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  for (const w of sorted) {
    counters[w.banner]++;
    if (w.rank_type === "5") counters[w.banner] = 0;
  }
  pity.standard = counters.standard;
  pity.character = counters.character;
  pity.weapon = counters.weapon;
  return pity;
}
