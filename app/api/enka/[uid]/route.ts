export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import "server-only";
import type { NextRequest } from "next/server";
import { getEnka } from "@/app/api/enka/client";
import type {
  EnkaClient,
  Character as EnkaCharacter,
  CharacterData,
  Weapon as EnkaWeapon,
  WeaponData,
  Artifact as EnkaArtifact,
  ArtifactData,
} from "enka-network-api";
import { NormalAttack, ElementalSkill, ElementalBurst } from "enka-network-api";

/* ------------ helpers ------------ */

const mapElement = (e?: string) =>
    (
        {
          Fire: "Pyro",
          Water: "Hydro",
          Ice: "Cryo",
          Electric: "Electro",
          Wind: "Anemo",
          Rock: "Geo",
          Grass: "Dendro",
          Pyro: "Pyro",
          Hydro: "Hydro",
          Cryo: "Cryo",
          Electro: "Electro",
          Anemo: "Anemo",
          Geo: "Geo",
          Dendro: "Dendro",
        } as Record<string, string>
    )[e ?? ""] ?? e ?? null;

function t(v: any): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v?.get === "function") {
    try { const s = v.get("en"); if (typeof s === "string") return s; } catch {}
  }
  if (typeof v?.en === "string") return v.en;
  if (typeof v?.text === "string") return v.text;
  return String(v);
}

function safeJSONStringify(obj: unknown) {
  const seen = new WeakSet();
  return JSON.stringify(
      obj,
      (_k, v) => {
        if (typeof v === "function" || typeof v === "symbol") return undefined;
        if (v && typeof v === "object") {
          if (seen.has(v as object)) return undefined;
          seen.add(v as object);
          const ctor = (v as any).constructor?.name;
          if (ctor === "Timeout" || ctor === "Immediate" || "_idleNext" in (v as any)) return undefined;
          if (typeof (v as any).toJSON === "function") {
            try { return (v as any).toJSON(); } catch {}
          }
        }
        return v;
      },
      0
  );
}

const SLOT_MAP: Record<string, string> = {
  EQUIP_BRACER: "Flower",
  EQUIP_NECKLACE: "Feather",
  EQUIP_SHOES: "Sands",
  EQUIP_RING: "Goblet",
  EQUIP_DRESS: "Circlet",
};
const SLOT_ORDER = ["Flower", "Feather", "Sands", "Goblet", "Circlet"];

function normalizeValue(v: any, forcePercent?: boolean) {
  if (typeof v !== "number" || Number.isNaN(v)) return { value: 0, isPercent: !!forcePercent };
  const isPct = forcePercent ?? (v > 0 && v < 1);
  if (isPct) return { value: Number((v * 100).toFixed(1)), isPercent: true };
  return { value: v, isPercent: false };
}

const GOOD_LABEL: Record<string, string> = {
  hp: "HP", hp_: "HP%", atk: "ATK", atk_: "ATK%", def: "DEF", def_: "DEF%",
  eleMas: "Elemental Mastery", enerRech_: "Energy Recharge%", heal_: "Healing Bonus%",
  critRate_: "CRIT Rate%", critDMG_: "CRIT DMG%",
  physical_dmg_: "Physical DMG Bonus%", anemo_dmg_: "Anemo DMG Bonus%", geo_dmg_: "Geo DMG Bonus%",
  electro_dmg_: "Electro DMG Bonus%", hydro_dmg_: "Hydro DMG Bonus%", pyro_dmg_: "Pyro DMG Bonus%",
  cryo_dmg_: "Cryo DMG Bonus%", dendro_dmg_: "Dendro DMG Bonus%",
};

function fromStatProperty(sp: any) {
  if (!sp) return undefined;
  let name =
      t(sp.fightPropName ?? sp.name ?? sp.text ?? sp.statProperty?.name) ||
      String(sp.fightProp ?? "");
  if (!name && sp.key) name = GOOD_LABEL[sp.key] ?? String(sp.key);
  const base = typeof sp.rawValue === "number" ? sp.rawValue : sp.value;
  const { value, isPercent } = normalizeValue(base, sp.isPercent);
  return { stat: name, value, isPercent };
}

/* ---------------- Defensive stat mappers ---------------- */

/** Prefer the largest positive candidate (handles typed=0 but JSON has value).
 *  Otherwise return the first non-null numeric candidate. */
function pickNumber(...candidates: any[]): number | null {
  const nums: number[] = [];
  for (const v of candidates) {
    if (typeof v === "number" && !Number.isNaN(v)) nums.push(v);
    else if (v && typeof v === "object") {
      if (typeof v.value === "number" && !Number.isNaN(v.value)) nums.push(v.value);
      else if (typeof v.final === "number" && !Number.isNaN(v.final)) nums.push(v.final);
    }
  }
  if (!nums.length) return null;
  const positives = nums.filter((n) => n > 0);
  return positives.length ? Math.max(...positives) : nums[0];
}

/** Convert 0–3 range to percent by *100; otherwise assume already % */
function toPercent(v: number | null): number | null {
  if (v == null) return null;
  return v <= 3 ? v * 100 : v;
}
/** Convert 0–3 range to fraction; if >=3 assume it's a percent and /100 */
function toFraction(v: number | null): number {
  if (v == null) return 0;
  return v <= 3 ? v : v / 100;
}

/** Sum flat HP from artifacts (main+subs) using our mapped labels */
function sumFlatHPFromArtifacts(arts: any[]): number {
  let total = 0;
  for (const a of arts || []) {
    const m = a?.mainstat;
    if (m && typeof m.value === "number" && !m.isPercent && String(m.stat).toLowerCase() === "hp") {
      total += m.value;
    }
    for (const s of a?.substats || []) {
      if (s && typeof s.value === "number" && !s.isPercent && String(s.stat).toLowerCase() === "hp") {
        total += s.value;
      }
    }
  }
  return total;
}

/** Merge typed statsObj + fightProps for robust reading
 *  (with optional flat HP from artifacts when HP_ADD is absent) */
function mapCoreStats(
    statsObj: any,
    fightProps: any,
    element?: string | null,
    artifactHPFlat?: number
) {
  const json =
      statsObj?.toJSON?.() ??
      statsObj?.toObject?.() ??
      (typeof statsObj === "object" ? statsObj : {}) ??
      {};
  const fp = fightProps ?? {};

  // --- Max HP ---
  let hp =
      pickNumber(
          statsObj?.health, statsObj?.hp, statsObj?.maxHP, statsObj?.maxHp,
          json.FIGHT_PROP_HP, fp.FIGHT_PROP_HP, fp.FIGHT_PROP_MAX_HP
      ) ?? 0;

  if (!hp || hp <= 1) {
    const base = pickNumber(
        statsObj?.healthBase, json.FIGHT_PROP_BASE_HP, fp.FIGHT_PROP_BASE_HP
    ) ?? 0;
    const pct = pickNumber(
        statsObj?.hpPercent, statsObj?.healthPercent,
        json.FIGHT_PROP_HP_PERCENT, fp.FIGHT_PROP_HP_PERCENT
    );
    let flat = pickNumber(
        statsObj?.hpFlat, statsObj?.healthAdd,
        json.FIGHT_PROP_HP_ADD, fp.FIGHT_PROP_HP_ADD
    ) ?? 0;

    // If the SDK doesn't expose HP_ADD, fill it from artifacts
    if (!flat && artifactHPFlat) flat = artifactHPFlat;

    hp = Math.round(base * (1 + toFraction(pct ?? 0)) + flat);
  }

  const atk = pickNumber(statsObj?.attack, json.FIGHT_PROP_ATTACK, fp.FIGHT_PROP_ATTACK) ?? 0;
  const def = pickNumber(statsObj?.defense, json.FIGHT_PROP_DEFENSE, fp.FIGHT_PROP_DEFENSE) ?? 0;

  const em = pickNumber(
      statsObj?.elementalMastery, statsObj?.elementMastery, statsObj?.elemMastery, statsObj?.em,
      json.FIGHT_PROP_ELEMENT_MASTERY, fp.FIGHT_PROP_ELEMENT_MASTERY
  ) ?? 0;

  const er = toPercent(pickNumber(
      statsObj?.chargeEfficiency, json.FIGHT_PROP_CHARGE_EFFICIENCY, fp.FIGHT_PROP_CHARGE_EFFICIENCY
  ));
  const cr = toPercent(pickNumber(
      statsObj?.critRate, json.FIGHT_PROP_CRITICAL, fp.FIGHT_PROP_CRITICAL
  ));
  const cd = toPercent(pickNumber(
      statsObj?.critDamage, json.FIGHT_PROP_CRITICAL_HURT, fp.FIGHT_PROP_CRITICAL_HURT
  ));

  const out: Record<string, number> = {
    "Max HP": hp,
    ATK: atk,
    DEF: def,
    "Elemental Mastery": em,
  };
  if (er != null) out["Energy Recharge"] = er;
  if (cr != null) out["CRIT Rate"] = cr;
  if (cd != null) out["CRIT DMG"] = cd;

  // Elemental DMG Bonus for own element
  const e = (element ?? "").toLowerCase();
  const jsonElemKey =
      e === "pyro"   ? "FIGHT_PROP_FIRE_ADD_HURT"  :
          e === "hydro"  ? "FIGHT_PROP_WATER_ADD_HURT" :
              e === "electro"? "FIGHT_PROP_ELEC_ADD_HURT"  :
                  e === "anemo"  ? "FIGHT_PROP_WIND_ADD_HURT"  :
                      e === "cryo"   ? "FIGHT_PROP_ICE_ADD_HURT"   :
                          e === "geo"    ? "FIGHT_PROP_ROCK_ADD_HURT"  :
                              e === "dendro" ? "FIGHT_PROP_GRASS_ADD_HURT" : null;

  const elemBonus = pickNumber(
      statsObj?.[`${e}Damage`],
      jsonElemKey ? json[jsonElemKey] : undefined,
      jsonElemKey ? fp[jsonElemKey] : undefined
  );
  if (elemBonus != null) out[`${element} DMG Bonus`] = toPercent(elemBonus)!;

  return out;
}

function mapBaseStats(statsObj: any, fightProps: any) {
  const json =
      statsObj?.toJSON?.() ??
      statsObj?.toObject?.() ??
      (typeof statsObj === "object" ? statsObj : {}) ??
      {};
  const fp = fightProps ?? {};

  return {
    "Base HP":  pickNumber(statsObj?.healthBase,  json.FIGHT_PROP_BASE_HP,        fp.FIGHT_PROP_BASE_HP)        ?? 0,
    "Base ATK": pickNumber(statsObj?.attackBase,  json.FIGHT_PROP_BASE_ATTACK,    fp.FIGHT_PROP_BASE_ATTACK)    ?? 0,
    "Base DEF": pickNumber(statsObj?.defenseBase, json.FIGHT_PROP_BASE_DEFENSE,   fp.FIGHT_PROP_BASE_DEFENSE)   ?? 0,
  };
}

/* ---- Talents (names + levels) via Character.skillLevels ---- */
type TalentTriplet = {
  normal?: { id: number; name: string | null; level: number | null };
  skill?: { id: number; name: string | null; level: number | null };
  burst?: { id: number; name: string | null; level: number | null };
};

function mapTalentsFromSkillLevels(c: EnkaCharacter, cd?: any): TalentTriplet {
  const out: TalentTriplet = {};
  const levels = (c as any)?.skillLevels;

  if (Array.isArray(levels) && levels.length) {
    for (const sl of levels) {
      const lvl = sl?.level?.value ?? sl?.level ?? null; // includes bonus/crown
      const nm = sl?.skill?.name ? t(sl.skill.name) : null;
      if (sl?.skill instanceof NormalAttack) {
        out.normal = { id: sl.skill.id, name: nm, level: typeof lvl === "number" ? lvl : null };
      } else if (sl?.skill instanceof ElementalSkill) {
        out.skill = { id: sl.skill.id, name: nm, level: typeof lvl === "number" ? lvl : null };
      } else if (sl?.skill instanceof ElementalBurst) {
        out.burst = { id: sl.skill.id, name: nm, level: typeof lvl === "number" ? lvl : null };
      }
    }
  }

  if (!out.normal || !out.skill || !out.burst) {
    const depot = (cd as any)?.skillDepot ?? (cd as any)?.skills ?? {};
    const normName =
        (depot?.normalAttack?.name && t(depot.normalAttack.name)) ||
        (cd?.skills?.normalAttack?.name && t(cd.skills.normalAttack.name)) ||
        null;
    const skillName =
        (depot?.elementalSkill?.name && t(depot.elementalSkill.name)) ||
        (cd?.skills?.elementalSkill?.name && t(cd.skills.elementalSkill.name)) ||
        null;
    const burstName =
        (depot?.elementalBurst?.name && t(depot.elementalBurst.name)) ||
        (cd?.skills?.elementalBurst?.name && t(cd.skills.elementalBurst.name)) ||
        null;

    if (!out.normal) out.normal = { id: 0, name: normName, level: null };
    if (!out.skill) out.skill = { id: 0, name: skillName, level: null };
    if (!out.burst) out.burst = { id: 0, name: burstName, level: null };
  }

  return out;
}

/* ------------ mappers ------------ */

function mapWeapon(w?: EnkaWeapon | null) {
  if (!w) return null;
  const wd: WeaponData | undefined = (w as any).data ?? (w as any).weaponData ?? undefined;

  return {
    id: wd?.id ? String(wd.id) : "",
    name: t(wd?.name ?? (w as any).name),
    type: (wd as any)?.weaponType ?? (w as any)?.type ?? null,
    rarity: (wd as any)?.rarity ?? (wd as any)?.stars ?? null,
    level: (w as any)?.level ?? null,
    refinement:
        (w as any)?.refinementRank ??
        (w as any)?.refinement ??
        (w as any)?.refinementLevel ??
        null,
    icon: (w as any)?.icon?.url ?? (wd as any)?.icon?.url ?? null,
  };
}

function mapArtifact(a: EnkaArtifact) {
  const ad: ArtifactData | undefined = (a as any).data ?? (a as any).artifactData ?? undefined;

  const equipType: string | undefined =
      (a as any)?.equipType ?? (ad as any)?.equipType ?? undefined;
  const slot = equipType ? SLOT_MAP[equipType] ?? equipType : undefined;

  const mainSP =
      (a as any).mainstat ||
      (a as any).mainStat ||
      (a as any).mainProperty ||
      (a as any).main;
  let mainstat = fromStatProperty(mainSP);

  let subsRaw: any = (a as any).substats || (a as any).subStats || (a as any).substatList;
  let subsArr: any[] = [];

  if (Array.isArray(subsRaw)) subsArr = subsRaw;
  else if (subsRaw?.toArray && typeof subsRaw.toArray === "function") subsArr = subsRaw.toArray();
  else if (Array.isArray(subsRaw?.list)) subsArr = subsRaw.list;
  else if (subsRaw && typeof subsRaw === "object") subsArr = Object.values(subsRaw);

  let substats = subsArr
      .map((s: any) => {
        if (s && typeof s === "object" && "stat" in s && "value" in s) {
          return { stat: String(s.stat || ""), value: s.value, isPercent: !!s.isPercent };
        }
        return fromStatProperty(s);
      })
      .filter((x: any) => x && x.stat && x.value !== undefined) as Array<{
    stat: string;
    value: number;
    isPercent?: boolean;
  }>;

  const needsGood = substats.length < 4 || substats.some((s) => !s.stat || s.value === undefined);
  if (needsGood && typeof (a as any).toGOOD === "function") {
    try {
      const good = (a as any).toGOOD();
      if (Array.isArray(good?.substats)) {
        const goodSubs = good.substats
            .filter((x: any) => x?.key)
            .map((x: any) => {
              const key = String(x.key);
              const isPercent = key.endsWith("_") || /_dmg_$/i.test(key);
              return { stat: GOOD_LABEL[key] ?? key, value: x.value, isPercent };
            });
        if (!substats.length) substats = goodSubs;
        else {
          const filled: any[] = [];
          const maxLen = Math.max(substats.length, goodSubs.length);
          for (let i = 0; i < maxLen; i++) {
            const a = substats[i];
            const g = goodSubs[i];
            if (a && a.stat && a.value !== undefined) filled.push(a);
            else if (g) filled.push(g);
          }
          while (filled.length < 4 && goodSubs[filled.length]) filled.push(goodSubs[filled.length]);
          substats = filled;
        }
      }
      if ((!mainstat || !mainstat.stat || mainstat.value === undefined) && good?.mainStatKey) {
        const key = String(good.mainStatKey);
        const isPercent = key.endsWith("_") || /_dmg_$/i.test(key);
        mainstat = { stat: GOOD_LABEL[key] ?? key, value: good.mainStatValue, isPercent };
      }
    } catch {}
  }

  return {
    id: ad?.id ? String(ad.id) : "",
    set: t((ad as any)?.set?.name) || t((a as any)?.set?.name) || (a as any)?.setName || "Unknown Set",
    rarity:
        (a as any)?.rarity ?? (a as any)?.rank ?? (ad as any)?.stars ?? (ad as any)?.rarity ?? null,
    level: (a as any)?.level ?? null,
    slot,
    mainstat,
    substats,
    icon: (a as any)?.icon?.url ?? (ad as any)?.icon?.url ?? null,
  };
}

function mapCharacter(c: EnkaCharacter) {
  const cd: CharacterData | undefined =
      (c as any).data ?? (c as any).characterData ?? undefined;

  const id = cd?.id ? String(cd.id) : String((c as any)?.id ?? "");
  const name = t(cd?.name ?? (c as any)?.name);

  const elementRaw =
      (cd as any)?.element?.id ??
      (cd as any)?.element?.name?.get?.("en") ??
      (c as any)?.element?.id ??
      (c as any)?.element;
  const element = mapElement(elementRaw);

  const icon =
      (c as any)?.costume?.icon?.url ??
      (c as any)?.icon?.url ??
      (cd as any)?.icon?.url ??
      null;

  const constellations =
      Array.isArray((c as any)?.constellations)
          ? (c as any).constellations.length
          : Array.isArray((c as any)?.talents)
              ? (c as any).talents.length
              : 0;

  const weapon = mapWeapon((c as any)?.weapon);

  const artsRaw: any[] =
      (c as any)?.artifacts ??
      (c as any)?.reliquaries ??
      ((c as any)?.equipments || []).filter((e: any) => e?.equipType || e?.slot) ??
      [];

  const artifacts = (Array.isArray(artsRaw) ? artsRaw : [])
      .map((a) => mapArtifact(a as any))
      .sort((a: any, b: any) => SLOT_ORDER.indexOf(a.slot as any) - SLOT_ORDER.indexOf(b.slot as any));

  // Stats (typed + fightProps) with computed HP flat from artifacts if needed
  const s = (c as any).stats ?? {};
  const fp = (c as any).fightProps ?? {};
  const hpFlatFromArts = sumFlatHPFromArtifacts(artifacts);
  const stats = mapCoreStats(s, fp, element, hpFlatFromArts);
  const baseStats = mapBaseStats(s, fp);

  // Talents
  const talents = mapTalentsFromSkillLevels(c, cd);

  return {
    id,
    name,
    level: (c as any)?.level ?? null,
    constellations,
    icon,
    weaponType: (cd as any)?.weaponType ?? null,
    rarity: (cd as any)?.rarity ?? (cd as any)?.quality ?? null,

    baseStats,
    stats,
    talentLevels: {
      normal: talents.normal?.level ?? null,
      skill: talents.skill?.level ?? null,
      burst: talents.burst?.level ?? null,
    },
    talents,

    weapon,
    artifacts,
    element,
  };
}

/* ------------ route ------------ */

export async function GET(_req: NextRequest, { params }: { params: { uid: string } }) {
  const uid = params.uid;
  if (!uid) {
    return new Response(JSON.stringify({ error: "Missing uid" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const enka: EnkaClient = await getEnka();
    const user = await enka.fetchUser(Number(uid));
    const detailed: any =
        typeof (user as any).fetchCharacters === "function"
            ? await (user as any).fetchCharacters()
            : user;

    const charList: EnkaCharacter[] =
        (detailed as any).characters ??
        (detailed as any).characterDetails ??
        [];

    const characters = (Array.isArray(charList) ? charList : [])
        .map((c) => mapCharacter(c))
        .filter((c) => c.id || c.name);

    const weapons = characters.map((ch) => ch.weapon || null);
    const artifacts = characters.flatMap((ch) => ch.artifacts || []).map((a) => a || null);

    const out = {
      player: {
        nickname: (detailed as any).playerInfo?.nickname ?? null,
        level: (detailed as any).playerInfo?.level ?? null,
        worldLevel: (detailed as any).playerInfo?.worldLevel ?? null,
        showCharacterDetails: (detailed as any)?.playerInfo?.showCharacterDetails ?? undefined,
      },
      characters,
      weapons,
      artifacts,
    };

    return new Response(safeJSONStringify(out), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e: any) {
    console.error("[enka] error", e);
    return new Response(safeJSONStringify({ error: e?.message ?? String(e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
