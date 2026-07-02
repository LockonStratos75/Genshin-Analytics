// Pity / 50-50 analytics computed straight from the stored wish list.

export type BannerKey = "character" | "weapon" | "standard";

export type FiveStarPull = {
  name: string;
  time: string;
  pity: number;
  banner: BannerKey;
  /** character banner only: won the 50/50 (true), lost to standard pool (false) */
  wonFifty?: boolean;
  /** was this pull guaranteed because the previous featured roll was lost */
  guaranteed?: boolean;
};

export type BannerStats = {
  banner: BannerKey;
  total: number;
  fiveStars: FiveStarPull[];
  fourStars: number;
  currentPity: number;
  currentPity4: number;
  softPity: number;
  hardPity: number;
  guaranteed: boolean;
  avgPity: number | null;
  winRate: number | null; // character banner only
};

// 5★ characters in the standard pool: pulling one of these on the event banner = lost 50/50.
const STANDARD_5STAR_CHARACTERS = new Set([
  "Diluc",
  "Jean",
  "Keqing",
  "Mona",
  "Qiqi",
  "Tighnari",
  "Dehya",
]);

// 5★ weapons in the standard pool: pulling one on the weapon banner = lost 75/25.
const STANDARD_5STAR_WEAPONS = new Set([
  "Amos' Bow",
  "Skyward Harp",
  "Skyward Blade",
  "Skyward Pride",
  "Skyward Spine",
  "Skyward Atlas",
  "Aquila Favonia",
  "Wolf's Gravestone",
  "Primordial Jade Winged-Spear",
  "Lost Prayer to the Sacred Winds",
]);

function lostFeatured(banner: BannerKey, name: string): boolean | undefined {
  if (banner === "character") return STANDARD_5STAR_CHARACTERS.has(name);
  if (banner === "weapon") return STANDARD_5STAR_WEAPONS.has(name);
  return undefined;
}

export function computeBannerStats(wishes: any[], banner: BannerKey): BannerStats {
  const hardPity = banner === "weapon" ? 80 : 90;
  const softPity = banner === "weapon" ? 63 : 74;

  const list = (wishes || [])
    .filter((w) => w?.banner === banner)
    .sort((a, b) => {
      const dt = new Date(a.time).getTime() - new Date(b.time).getTime();
      if (dt !== 0) return dt;
      // same-second batch (10-pull): use id order when available
      return String(a.id ?? "").localeCompare(String(b.id ?? ""));
    });

  const fiveStars: FiveStarPull[] = [];
  let counter = 0;
  let counter4 = 0;
  let fourStars = 0;
  let guaranteed = false;

  for (const w of list) {
    counter++;
    counter4++;
    const rank = String(w.rank_type ?? w.rarity ?? "3");
    if (rank === "4") {
      fourStars++;
      counter4 = 0;
    } else if (rank === "5") {
      const lost = lostFeatured(banner, String(w.name ?? ""));
      fiveStars.push({
        name: String(w.name ?? "Unknown"),
        time: String(w.time ?? ""),
        pity: counter,
        banner,
        wonFifty: lost === undefined ? undefined : guaranteed ? undefined : !lost,
        guaranteed,
      });
      // next featured roll is guaranteed if this one was lost while not already guaranteed
      if (lost !== undefined) guaranteed = guaranteed ? false : lost;
      counter = 0;
    }
  }

  const pities = fiveStars.map((f) => f.pity);
  const decided = fiveStars.filter((f) => f.wonFifty !== undefined);
  const winRate =
    banner !== "standard" && decided.length
      ? (decided.filter((f) => f.wonFifty).length / decided.length) * 100
      : null;

  return {
    banner,
    total: list.length,
    fiveStars,
    fourStars,
    currentPity: counter,
    currentPity4: counter4,
    softPity,
    hardPity,
    guaranteed,
    avgPity: pities.length ? pities.reduce((a, b) => a + b, 0) / pities.length : null,
    winRate,
  };
}

export function computeAllStats(wishes: any[]) {
  const character = computeBannerStats(wishes, "character");
  const weapon = computeBannerStats(wishes, "weapon");
  const standard = computeBannerStats(wishes, "standard");
  const total = (wishes || []).length;
  const allFive = [...character.fiveStars, ...weapon.fiveStars, ...standard.fiveStars].sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
  );
  return {
    character,
    weapon,
    standard,
    total,
    primogems: total * 160,
    allFive,
  };
}
