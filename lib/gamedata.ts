import "server-only";
import genshindb from "genshin-db";
import { slugify, enkaIcon, cleanDesc } from "./display";

export type CharacterSummary = {
  id: number;
  name: string;
  slug: string;
  title: string;
  rarity: number;
  element: string;
  weaponType: string;
  region: string;
  substat: string;
  version: string;
  icon: string;
};

export type WeaponSummary = {
  name: string;
  slug: string;
  rarity: number;
  type: string;
  baseAtk: number;
  substat: string;
  substatValue: string;
  effectName: string;
  effect: string;
  icon: string;
};

export type ArtifactSetSummary = {
  name: string;
  slug: string;
  maxRarity: number;
  rarities: number[];
  bonus1?: string;
  bonus2?: string;
  bonus4?: string;
  icon: string;
};

const opts = { matchCategories: true } as const;

let charCache: CharacterSummary[] | null = null;
let weaponCache: WeaponSummary[] | null = null;
let artifactCache: ArtifactSetSummary[] | null = null;

export function getAllCharacters(): CharacterSummary[] {
  if (charCache) return charCache;
  const names: string[] = (genshindb.characters("names", opts) as unknown as string[]) || [];
  charCache = names
    .map((n) => genshindb.characters(n) as any)
    .filter(Boolean)
    .map((c: any) => ({
      id: Number(c.id) || 0,
      name: c.name,
      slug: slugify(c.name),
      title: c.title || "",
      rarity: Number(c.rarity) || 4,
      element: c.elementText || c.element || "None",
      weaponType: c.weaponText || c.weapon || "",
      region: c.region || "",
      substat: c.substatText || "",
      version: c.version || "",
      icon: enkaIcon(c.images?.filename_icon),
    }))
    // Traveler twins have no fixed element; keep them but they sort last.
    .sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name));
  return charCache;
}

export function getCharacterBySlug(slug: string) {
  const summary = getAllCharacters().find((c) => c.slug === slug);
  if (!summary) return null;
  const c: any = genshindb.characters(summary.name);
  if (!c) return null;
  const stats90 = typeof c.stats === "function" ? c.stats(90) : null;
  const talents: any = genshindb.talents(summary.name);
  const cons: any = genshindb.constellations(summary.name);
  return {
    ...summary,
    description: c.description || "",
    affiliation: c.affiliation || "",
    constellationName: c.constellation || "",
    birthday: c.birthday || "",
    splash: enkaIcon(c.images?.filename_gachaSplash),
    stats90,
    talents: talents
      ? [
          { kind: "Normal Attack", ...pickTalent(talents.combat1) },
          { kind: "Elemental Skill", ...pickTalent(talents.combat2) },
          { kind: "Elemental Burst", ...pickTalent(talents.combat3) },
          ...(talents.passive1 ? [{ kind: "Passive", ...pickTalent(talents.passive1) }] : []),
          ...(talents.passive2 ? [{ kind: "Passive", ...pickTalent(talents.passive2) }] : []),
          ...(talents.passive3 ? [{ kind: "Passive", ...pickTalent(talents.passive3) }] : []),
        ].filter((t) => t.name)
      : [],
    constellations: cons
      ? [cons.c1, cons.c2, cons.c3, cons.c4, cons.c5, cons.c6]
          .filter(Boolean)
          .map((k: any, i: number) => ({
            position: i + 1,
            name: k.name,
            description: cleanDesc(k.descriptionRaw || k.description),
          }))
      : [],
  };
}

function pickTalent(t: any) {
  if (!t) return { name: "" };
  return {
    name: t.name || "",
    description: cleanDesc(t.descriptionRaw || t.description || "").split("\n")[0] || "",
  };
}

export function getAllWeapons(): WeaponSummary[] {
  if (weaponCache) return weaponCache;
  const names: string[] = (genshindb.weapons("names", opts) as unknown as string[]) || [];
  weaponCache = names
    .map((n) => genshindb.weapons(n) as any)
    .filter(Boolean)
    .map((w: any) => {
      const max = typeof w.stats === "function" ? w.stats(w.rarity >= 3 ? 90 : 70) : null;
      return {
        name: w.name,
        slug: slugify(w.name),
        rarity: Number(w.rarity) || 1,
        type: w.weaponText || w.weapon || "",
        baseAtk: Math.round(max?.attack ?? w.baseAtkValue ?? 0),
        substat: w.mainStatText || "",
        substatValue: substatAtMax(w, max),
        effectName: w.effectName || "",
        effect: cleanDesc(w.r1?.description || ""),
        icon: enkaIcon(w.images?.filename_icon),
      };
    })
    .sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name));
  return weaponCache;
}

function substatAtMax(w: any, max: any): string {
  if (!max?.specialized) return w.baseStatText || "";
  // Every weapon substat is a percentage except Elemental Mastery.
  const isFlat = /elemental mastery/i.test(w.mainStatText || "");
  const v = max.specialized;
  return isFlat ? `${Math.round(v)}` : `${(v * 100).toFixed(1)}%`;
}

export function getAllArtifactSets(): ArtifactSetSummary[] {
  if (artifactCache) return artifactCache;
  const names: string[] = (genshindb.artifacts("names", opts) as unknown as string[]) || [];
  artifactCache = names
    .map((n) => genshindb.artifacts(n) as any)
    .filter(Boolean)
    .map((a: any) => {
      const rarities: number[] = a.rarityList || [];
      const iconFile =
        a.images?.filename_flower ||
        a.images?.filename_circlet ||
        a.images?.filename_goblet ||
        "";
      return {
        name: a.name,
        slug: slugify(a.name),
        maxRarity: rarities.length ? Math.max(...rarities) : 5,
        rarities,
        bonus1: a.effect1Pc ? cleanDesc(a.effect1Pc) : undefined,
        bonus2: a.effect2Pc ? cleanDesc(a.effect2Pc) : undefined,
        bonus4: a.effect4Pc ? cleanDesc(a.effect4Pc) : undefined,
        icon: enkaIcon(iconFile),
      };
    })
    .sort((a, b) => b.maxRarity - a.maxRarity || a.name.localeCompare(b.name));
  return artifactCache;
}
