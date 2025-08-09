// app/api/enka/[uid]/route.ts
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

/** Coerce any Enka TextAssets-like thing to a plain English string */
function t(v: any): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v?.get === "function") {
    try {
      const s = v.get("en");
      if (typeof s === "string") return s;
    } catch {}
  }
  if (typeof v?.en === "string") return v.en;
  if (typeof v?.text === "string") return v.text;
  return String(v);
}

/** JSON without cycles/functions (safe to send via NextResponse) */
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
            try {
              return (v as any).toJSON();
            } catch {}
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

/** convert a numeric value to percentage when it’s a fractional percent (0–1) */
function normalizeValue(v: any, forcePercent?: boolean) {
  if (typeof v !== "number") return { value: v, isPercent: !!forcePercent };
  const isPct = forcePercent ?? (v > 0 && v < 1);
  if (isPct) return { value: Number((v * 100).toFixed(1)), isPercent: true };
  return { value: v, isPercent: false };
}

/** labels for GOOD keys as a fallback */
const GOOD_LABEL: Record<string, string> = {
  hp: "HP",
  hp_: "HP%",
  atk: "ATK",
  atk_: "ATK%",
  def: "DEF",
  def_: "DEF%",
  eleMas: "Elemental Mastery",
  enerRech_: "Energy Recharge%",
  heal_: "Healing Bonus%",
  critRate_: "CRIT Rate%",
  critDMG_: "CRIT DMG%",
  physical_dmg_: "Physical DMG Bonus%",
  anemo_dmg_: "Anemo DMG Bonus%",
  geo_dmg_: "Geo DMG Bonus%",
  electro_dmg_: "Electro DMG Bonus%",
  hydro_dmg_: "Hydro DMG Bonus%",
  pyro_dmg_: "Pyro DMG Bonus%",
  cryo_dmg_: "Cryo DMG Bonus%",
  dendro_dmg_: "Dendro DMG Bonus%",
};

/** build a {stat, value, isPercent} from StatProperty-like shapes */
function fromStatProperty(sp: any) {
  if (!sp) return undefined;
  const name = t(sp.fightPropName ?? sp.name ?? sp.text);
  // Some wrappers already pre-multiply percentages; prefer rawValue+isPercent if present
  const base = typeof sp.rawValue === "number" ? sp.rawValue : sp.value;
  const { value, isPercent } = normalizeValue(base, sp.isPercent);
  return { stat: name, value, isPercent };
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

  // slot from the data’s equipType
  const equipType: string | undefined =
      (a as any)?.equipType ?? (ad as any)?.equipType ?? undefined;
  const slot = equipType ? SLOT_MAP[equipType] ?? equipType : undefined;

  // ----- MAIN STAT (StatProperty) -----
  const mainSP = (a as any).mainstat || (a as any).mainStat || (a as any).mainProperty;
  let mainstat = fromStatProperty(mainSP);

  // ----- SUBSTATS (SubstatsContainer) -----
  let subsRaw: any = (a as any).substats || (a as any).subStats;
  let subsArr: any[] = [];

  if (Array.isArray(subsRaw)) {
    subsArr = subsRaw;
  } else if (subsRaw?.toArray && typeof subsRaw.toArray === "function") {
    subsArr = subsRaw.toArray();
  } else if (Array.isArray(subsRaw?.list)) {
    subsArr = subsRaw.list;
  } else if (subsRaw && typeof subsRaw === "object") {
    subsArr = Object.values(subsRaw);
  }

  // First pass: try reading container values directly (these can be 0.466 style)
  let substats = subsArr
      .map((s: any) => fromStatProperty(s))   // <-- you already have this helper
      .filter((x: any) => x && x.stat && x.value !== undefined);

// If we didn't get 4 clean subs, fall back to GOOD.
// IMPORTANT: GOOD values are already in game units (percent already scaled).
  const needsGood = substats.length < 4 || substats.some(s => !s.stat || s.value === undefined);
  if (needsGood && typeof (a as any).toGOOD === "function") {
    try {
      const good = (a as any).toGOOD();

      // ---- SUBSTATS FROM GOOD (NO SCALING) ----
      if (Array.isArray(good?.substats)) {
        const goodSubs = good.substats
            .filter((x: any) => x?.key)
            .map((x: any) => {
              const key = String(x.key);
              const isPercent = key.endsWith("_") || /_dmg_$/i.test(key);
              return {
                stat: GOOD_LABEL[key] ?? key,
                value: x.value,           // <- keep as-is from GOOD
                isPercent,                // for UI
              };
            });

        if (!substats.length) {
          substats = goodSubs;
        } else {
          // fill any blanks with GOOD
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

      // ---- MAIN STAT FROM GOOD (NO SCALING) ----
      if ((!mainstat || !mainstat.stat || mainstat.value === undefined) && good?.mainStatKey) {
        const key = String(good.mainStatKey);
        const isPercent = key.endsWith("_") || /_dmg_$/i.test(key);
        mainstat = {
          stat: GOOD_LABEL[key] ?? key,
          value: good.mainStatValue,  // <- keep as-is from GOOD
          isPercent,
        };
      }
    } catch {}
  }

  return {
    id: ad?.id ? String(ad.id) : "",
    set:
        t((ad as any)?.set?.name) ||
        t((a as any)?.set?.name) ||
        (a as any)?.setName ||
        "Unknown Set",
    rarity:
        (a as any)?.rarity ??
        (a as any)?.rank ??
        (ad as any)?.stars ??
        (ad as any)?.rarity ??
        null,
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
      .sort(
          (a: any, b: any) =>
              SLOT_ORDER.indexOf(a.slot as any) - SLOT_ORDER.indexOf(b.slot as any)
      );

  return {
    id,
    name,
    level: (c as any)?.level ?? null,
    constellations,
    icon,
    weaponType: (cd as any)?.weaponType ?? null,
    rarity: (cd as any)?.rarity ?? (cd as any)?.quality ?? null,
    baseStats: {},
    talentLevels: { normal: null, skill: null, burst: null },
    weapon,
    artifacts,
    element,
  };
}

/* ------------ route ------------ */

export async function GET(
    _req: NextRequest,
    { params }: { params: { uid: string } }
) {
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
    const artifacts = characters
        .flatMap((ch) => ch.artifacts || [])
        .map((a) => a || null);

    const out = {
      player: {
        nickname: (detailed as any).playerInfo?.nickname ?? null,
        level: (detailed as any).playerInfo?.level ?? null,
        worldLevel: (detailed as any).playerInfo?.worldLevel ?? null,
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
