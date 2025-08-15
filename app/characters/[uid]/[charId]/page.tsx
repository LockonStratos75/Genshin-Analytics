// app/characters/[uid]/[charId]/page.tsx
import type { Metadata } from "next";
import { headers } from "next/headers";

/* ---------------- types ---------------- */
type Sub = { stat?: string; value?: number; isPercent?: boolean };
type Main = { stat?: string; value?: number; isPercent?: boolean };
type Artifact = {
    id?: string;
    set?: string;
    rarity?: number | null;
    level?: number | null;
    slot?: string;
    mainstat?: Main;
    substats?: Sub[] | { substats?: Sub[] } | any;
    icon?: string | null;
};
type Weapon = {
    id?: string;
    name?: string;
    type?: string | null;
    rarity?: number | null;
    level?: number | null;
    refinement?: number | null;
    icon?: string | null;
};
type Character = {
    id: string;
    name: string;
    level?: number;
    constellations?: number;
    icon?: string | null;
    weaponType?: string | null;
    rarity?: string | number | null;
    artifacts?: Artifact[];
    weapon?: Weapon | null;
    element?: string | null;
    /** added by API below */
    stats?: Record<string, number>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
                                           params,
                                       }: {
    params: { uid: string; charId: string };
}): Promise<Metadata> {
    return { title: `Character • ${params.charId}` };
}

/* ---------------- helpers ---------------- */

function getBaseUrl() {
    if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
    const h = headers();
    const host = h.get("host") || "localhost:3000";
    const proto = host.includes("localhost") || host.startsWith("127.") ? "http" : "https";
    return `${proto}://${host}`;
}

function pctStat(stat?: string) {
    if (!stat) return false;
    const k = stat.toLowerCase();
    return (
        k.includes("hp%") ||
        k.includes("atk%") ||
        k.includes("def%") ||
        k.includes("crit rate") ||
        k.includes("crit dmg") ||
        k.includes("energy recharge") ||
        k.endsWith(" dmg bonus") ||
        k.endsWith(" dmg bonus%") ||
        k.includes("healing bonus")
    );
}

function fmt(stat?: string, value?: number, isPercent?: boolean) {
    if (value == null || Number.isNaN(value)) return "—";
    const asPct = typeof isPercent === "boolean" ? isPercent : pctStat(stat);
    const v = asPct && value > 0 && value < 1 ? value * 100 : value;
    return asPct ? `${v.toFixed(1)}%` : `${v}`;
}
function stars(n?: number | null) {
    if (!n) return "—";
    return Array(n).fill("★").join("");
}

/** Best-effort extraction of text from TextAssets-like objects */
function txt(v: any): string {
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
    return "";
}

/** Map Enka fight-prop codes to human labels */
function fightPropLabel(code?: string): string | null {
    if (!code) return null;
    const k = String(code).toUpperCase();
    const map: Record<string, string> = {
        FIGHT_PROP_HP: "HP",
        FIGHT_PROP_HP_PERCENT: "HP%",
        FIGHT_PROP_ATTACK: "ATK",
        FIGHT_PROP_ATTACK_PERCENT: "ATK%",
        FIGHT_PROP_DEFENSE: "DEF",
        FIGHT_PROP_DEFENSE_PERCENT: "DEF%",
        FIGHT_PROP_CRITICAL: "CRIT Rate",
        FIGHT_PROP_CRITICAL_HURT: "CRIT DMG",
        FIGHT_PROP_ELEMENT_MASTERY: "Elemental Mastery",
        FIGHT_PROP_CHARGE_EFFICIENCY: "Energy Recharge",
        FIGHT_PROP_HEAL_ADD: "Healing Bonus",
        FIGHT_PROP_PHYSICAL_ADD_HURT: "Physical DMG Bonus",
        FIGHT_PROP_FIRE_ADD_HURT: "Pyro DMG Bonus",
        FIGHT_PROP_WATER_ADD_HURT: "Hydro DMG Bonus",
        FIGHT_PROP_ELEC_ADD_HURT: "Electro DMG Bonus",
        FIGHT_PROP_WIND_ADD_HURT: "Anemo DMG Bonus",
        FIGHT_PROP_ICE_ADD_HURT: "Cryo DMG Bonus",
        FIGHT_PROP_ROCK_ADD_HURT: "Geo DMG Bonus",
        FIGHT_PROP_GRASS_ADD_HURT: "Dendro DMG Bonus",
    };
    return map[k] ?? null;
}

/** Normalize substats from all known shapes without losing names already present */
function normalizeSubstats(a?: Artifact): Sub[] {
    if (!a) return [];

    // If API already provided clean array of {stat,value,isPercent}, keep it.
    if (Array.isArray((a as any).substats) && (a as any).substats.every((x: any) => "stat" in (x || {}))) {
        return (a as any).substats as Sub[];
    }

    // Otherwise pull out inner list variations
    const raw =
        Array.isArray((a as any)?.substats?.substats)
            ? (a as any).substats.substats
            : Array.isArray((a as any)?.substats)
                ? (a as any).substats
                : Array.isArray((a as any)?.subStats)
                    ? (a as any).subStats
                    : Array.isArray((a as any)?.substatList)
                        ? (a as any).substatList
                        : [];

    return (raw as any[]).map((s: any) => {
        // Try every known location for human-readable name, then codes
        const nameFromText =
            txt(s?.fightPropName) ||
            txt(s?.statProperty?.fightPropName) ||
            txt(s?.statProperty?.name) ||
            txt(s?.name) ||
            txt(s?.statText) ||
            txt(s?.stat);

        const nameFromCode = fightPropLabel(s?.fightProp || s?.type || s?.propType);
        const statName = nameFromText || nameFromCode || "";

        // If Enka gives pre-multiplied percent flags, respect them
        const hintedPercent =
            typeof s?.isPercent === "boolean"
                ? s.isPercent
                : /%$/.test(statName) ||
                /CRIT Rate|CRIT DMG|Energy Recharge|DMG Bonus|Healing Bonus/i.test(statName);

        return {
            stat: statName,
            value: Number(s?.value ?? s?.statValue ?? 0),
            isPercent: hintedPercent,
        };
    });
}

/* ---------------- page ---------------- */

export default async function CharacterPage({
                                                params,
                                            }: {
    params: { uid: string; charId: string };
}) {
    const { uid, charId } = params;

    // Use absolute URL so it works on prod too
    const res = await fetch(`${getBaseUrl()}/api/enka/${encodeURIComponent(uid)}`, {
        cache: "no-store",
    });

    if (!res.ok) {
        return (
            <div className="card p-6">
                <h1 className="text-lg font-semibold">Failed to load data</h1>
                <p className="opacity-70 mt-1">
                    {res.status} {res.statusText}
                </p>
            </div>
        );
    }

    const data = await res.json();
    const characters: Character[] = Array.isArray(data?.characters) ? data.characters : [];
    const c = characters.find((x) => String(x.id) === String(charId));

    if (!c) {
        return (
            <div className="card p-6">
                <h1 className="text-lg font-semibold">Character not found</h1>
                <p className="opacity-70 mt-1">ID: {charId}</p>
            </div>
        );
    }

    const artifacts = (c.artifacts || []).map((a) => ({
        ...a,
        substats: normalizeSubstats(a),
    }));

    // Nice order for the top stats block (akasha-like)
    const statOrder = [
        "Max HP",
        "ATK",
        "DEF",
        "Elemental Mastery",
        "CRIT Rate",
        "CRIT DMG",
        "Energy Recharge",
        "Pyro DMG Bonus",
        "Hydro DMG Bonus",
        "Electro DMG Bonus",
        "Anemo DMG Bonus",
        "Cryo DMG Bonus",
        "Geo DMG Bonus",
        "Dendro DMG Bonus",
        "Physical DMG Bonus",
        "Healing Bonus",
    ] as const;

    // Consume stats from API (added in step 2 below)
    const s: Record<string, number> = (c as any).stats || {};

    return (
        <div className="card p-5">
            {/* header */}
            <div className="flex items-center gap-4">
                {c.icon ? (
                    <img
                        src={c.icon}
                        alt={c.name}
                        className="w-20 h-20 rounded-2xl object-cover ring-1 ring-black/10 dark:ring-white/10"
                    />
                ) : (
                    <div className="w-20 h-20 rounded-2xl bg-black/10 dark:bg-white/10" />
                )}
                <div className="min-w-0">
                    <div className="text-xl font-semibold">{c.name}</div>
                    <div className="opacity-75 text-sm">
                        Lv {c.level ?? "—"} • {c.element ?? "—"} • C{c.constellations ?? 0}
                    </div>
                </div>
            </div>

            {/* top stats (akasha-like) */}
            {Object.keys(s).length > 0 && (
                <div className="mt-6 grid gap-3 md:grid-cols-3 lg:grid-cols-4">
                    {statOrder
                        .filter((k) => s[k] != null)
                        .map((k) => (
                            <div
                                key={k}
                                className="rounded-xl border border-black/10 dark:border-white/10 p-3 bg-white/60 dark:bg-white/5"
                            >
                                <div className="text-[10px] uppercase opacity-60">{k}</div>
                                <div className="text-lg font-semibold tabular-nums">
                                    {fmt(k, s[k], undefined)}
                                </div>
                            </div>
                        ))}
                </div>
            )}

            {/* weapon */}
            <div className="mt-6">
                <div className="text-sm opacity-70 mb-2">Weapon</div>
                {c.weapon ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-black/10 dark:border-white/10 p-3">
                        {c.weapon.icon ? (
                            <img src={c.weapon.icon} alt="" className="w-10 h-10 rounded-lg" />
                        ) : (
                            <div className="w-10 h-10 rounded-lg bg-black/10 dark:bg-white/10" />
                        )}
                        <div className="min-w-0">
                            <div className="font-medium">{c.weapon.name ?? c.weapon.id}</div>
                            <div className="text-xs opacity-70">
                                {c.weapon.type ?? "—"} • {c.weapon.rarity ?? "—"}★ • R{c.weapon.refinement ?? 1} • Lv{" "}
                                {c.weapon.level ?? "—"}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="subtle">No weapon equipped</div>
                )}
            </div>

            {/* artifacts */}
            <div className="mt-8">
                <div className="text-sm opacity-70 mb-3">Artifacts</div>
                {artifacts.length === 0 ? (
                    <div className="subtle">No artifacts</div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {artifacts.map((a, i) => {
                            const subs = Array.isArray(a.substats) ? (a.substats as Sub[]) : [];
                            const subs4: (Sub | null)[] = [...subs];
                            while (subs4.length < 4) subs4.push(null);

                            return (
                                <div
                                    key={`${a.id || i}-${a.slot}-${a.level}`}
                                    className="rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-white/70 dark:bg-white/5 backdrop-blur-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        {a.icon ? (
                                            <img src={a.icon} alt="" className="w-12 h-12 rounded-xl" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-black/10 dark:bg-white/10" />
                                        )}
                                        <div className="min-w-0">
                                            <div className="font-semibold truncate">{a.set || "Unknown Set"}</div>
                                            <div className="text-xs opacity-70">
                                                {a.slot ?? "—"} • {stars(a.rarity as number)} • +{a.level ?? 0}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-5 gap-3 items-stretch">
                                        {/* main */}
                                        <div className="col-span-2 rounded-xl border border-black/5 dark:border-white/5 p-3 bg-black/5 dark:bg-white/5 flex flex-col min-h-[110px]">
                                            <div className="text-[10px] uppercase opacity-70">Main Stat</div>
                                            <div className="mt-1 text-sm font-medium truncate">{a.mainstat?.stat || "—"}</div>
                                            <div className="mt-auto text-2xl font-bold tabular-nums">
                                                {fmt(a.mainstat?.stat, a.mainstat?.value, a.mainstat?.isPercent)}
                                            </div>
                                        </div>

                                        {/* subs */}
                                        <div className="col-span-3 grid grid-cols-2 gap-3">
                                            {subs4.map((s, idx) => (
                                                <div
                                                    key={idx}
                                                    className="rounded-xl border border-black/5 dark:border-white/5 p-2.5 bg-white/60 dark:bg-white/5 flex flex-col min-h-[52px]"
                                                >
                                                    <div className="text-[10px] uppercase opacity-60">{s?.stat || "—"}</div>
                                                    <div className="mt-1 text-sm font-semibold tabular-nums">
                                                        {s ? fmt(s.stat, s.value, s.isPercent) : "—"}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
