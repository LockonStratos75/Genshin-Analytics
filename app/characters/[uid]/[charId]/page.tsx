// app/characters/[uid]/[charId]/page.tsx
import type { Metadata } from "next";
import { headers } from "next/headers";
import RefreshAkashaButton from "@/components/RefreshAkashaButton";

/* ---------------- types (loose to avoid build friction) ---------------- */
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

type TalentEntry = { name?: string | null; level?: number | null };
type Talents = { normal?: TalentEntry; skill?: TalentEntry; burst?: TalentEntry };

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
    stats?: Record<string, number>;
    baseStats?: Record<string, number>;
    talents?: Talents;
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
function pctStat(stat?: string) {
    if (!stat) return false;
    return /(rate|dmg|bonus|recharge|%)/i.test(stat.toLowerCase());
}
function fmt(stat?: string, value?: number, isPercent?: boolean) {
    if (value == null || Number.isNaN(value)) return "—";
    const asPct = typeof isPercent === "boolean" ? isPercent : pctStat(stat);
    const v = asPct && value > 0 && value < 1 ? value * 100 : value;
    return asPct ? `${v.toFixed(1)}%` : `${Math.round(v).toLocaleString()}`;
}
function stars(n?: number | null) {
    if (!n) return "—";
    return Array(n).fill("★").join("");
}
function normalizeSubstats(a?: Artifact): Sub[] {
    if (!a) return [];
    if (Array.isArray((a as any)?.substats) && (a as any).substats.every((x: any) => x && typeof x.stat === "string")) {
        return (a as any).substats as Sub[];
    }
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

    return (raw as any[]).map((s: any) => ({
        stat:
            s?.fightPropName?.get?.("en") ||
            s?.statProperty?.name ||
            s?.type ||
            s?.propType ||
            s?.key ||
            s?.stat ||
            "",
        value: Number(s?.value ?? s?.statValue ?? 0),
        isPercent: !!s?.isPercent,
    }));
}
function absoluteApiUrl(path: string) {
    if (/^https?:\/\//i.test(path)) return path;
    const h = headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
    return `${proto}://${host}${path.startsWith("/") ? path : `/${path}`}`;
}

/* ---------------- page ---------------- */
export default async function CharacterPage({
                                                params,
                                            }: {
    params: { uid: string; charId: string };
}) {
    const { uid, charId } = params;

    // Fetch Enka + Akasha concurrently (short TTLs)
    const [enkaRes, akRes] = await Promise.all([
        fetch(absoluteApiUrl(`/api/enka/${encodeURIComponent(uid)}`), {
            next: { revalidate: 300 }, // 5 min
        }),
        fetch(absoluteApiUrl(`/api/akasha/${encodeURIComponent(uid)}`), {
            next: { revalidate: 600 }, // 10 min
        }),
    ]);

    if (!enkaRes.ok) {
        return (
            <div className="card p-6">
                <h1 className="text-lg font-semibold">Failed to load data</h1>
                <p className="opacity-70 mt-1">
                    {enkaRes.status} {enkaRes.statusText}
                </p>
            </div>
        );
    }

    const data = await enkaRes.json();
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

    // Pull Akasha entry (safe if API is down)
    let ak: any = null;
    try {
        const akasha = akRes.ok ? await akRes.json() : null;
        ak =
            akasha?.calculations?.find(
                (x: any) => (x.character || "").toLowerCase() === c.name.toLowerCase()
            ) ?? null;
    } catch {
        ak = null;
    }

    const artifacts = (c.artifacts || []).map((a) => ({ ...a, substats: normalizeSubstats(a) }));

    const statOrder = [
        "Max HP",
        "ATK",
        "DEF",
        "Elemental Mastery",
        "CRIT Rate",
        "CRIT DMG",
        "Energy Recharge",
        "Physical DMG Bonus",
        "Pyro DMG Bonus",
        "Hydro DMG Bonus",
        "Electro DMG Bonus",
        "Anemo DMG Bonus",
        "Cryo DMG Bonus",
        "Geo DMG Bonus",
        "Dendro DMG Bonus",
        "Healing Bonus",
    ];
    const stats = c.stats || {};
    const primaryStats = statOrder.filter((k) => k in stats);
    const extraStats = Object.keys(stats).filter((k) => !statOrder.includes(k));

    return (
        <div className="card p-5">
            {/* Akasha badge + refresh */}
            <div className="mb-4 flex items-center gap-2">
                {ak ? (
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 px-3 py-1 text-xs border border-emerald-600/20">
                        <span className="font-medium">Leaderboard</span>
                        <span>Top {Number(ak.topPercent ?? 0).toFixed(0)}%</span>
                        {ak.url ? (
                            <a
                                href={ak.url}
                                target="_blank"
                                rel="noreferrer"
                                className="underline opacity-80 hover:opacity-100"
                            >
                                View
                            </a>
                        ) : null}
                    </div>
                ) : (
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-300 px-3 py-1 text-xs">
                        No Akasha entry
                    </div>
                )}
                <RefreshAkashaButton uid={uid} />
            </div>

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

            {/* stats panel */}
            {!!Object.keys(stats).length && (
                <div className="mt-6">
                    <div className="text-sm opacity-70 mb-2">Stats</div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {primaryStats.map((k) => (
                            <div
                                key={k}
                                className="rounded-xl border border-black/10 dark:border-white/10 p-3 bg-white/60 dark:bg-white/5 flex items-center justify-between"
                            >
                                <div className="text-xs opacity-70">{k}</div>
                                <div className="text-sm font-semibold tabular-nums">
                                    {fmt(k, stats[k], /(Rate|DMG|Bonus|Recharge)/i.test(k))}
                                </div>
                            </div>
                        ))}
                        {extraStats.map((k) => (
                            <div
                                key={k}
                                className="rounded-xl border border-black/10 dark:border-white/10 p-3 bg-white/40 dark:bg-white/5 flex items-center justify-between"
                            >
                                <div className="text-xs opacity-60">{k}</div>
                                <div className="text-sm font-semibold tabular-nums">
                                    {fmt(k, stats[k], /(Rate|DMG|Bonus|Recharge)/i.test(k))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* base stats */}
            {!!c.baseStats && Object.keys(c.baseStats).length > 0 && (
                <div className="mt-6">
                    <div className="text-sm opacity-70 mb-2">Base stats</div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(c.baseStats).map(([k, v]) => (
                            <div
                                key={k}
                                className="rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 px-3 py-2 flex items-center justify-between"
                            >
                                <div className="text-xs opacity-70">{k}</div>
                                <div className="text-sm font-semibold tabular-nums">
                                    {Number(v).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* talents */}
            {!!c.talents && (
                <div className="mt-8">
                    <div className="text-sm opacity-70 mb-2">Talents</div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {([
                            ["normal", "Normal Attack"],
                            ["skill", "Elemental Skill"],
                            ["burst", "Elemental Burst"],
                        ] as const).map(([key, label]) => {
                            const t = (c as any).talents?.[key];
                            if (!t || (!t.name && !t.level)) return null;
                            return (
                                <div
                                    key={key}
                                    className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3"
                                >
                                    <div className="text-xs opacity-60">{label}</div>
                                    <div className="text-sm font-semibold leading-tight">
                                        {t.name ?? "—"}
                                    </div>
                                    <div className="text-xs opacity-70 mt-1">Level: {t.level ?? "—"}</div>
                                </div>
                            );
                        })}
                    </div>
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
                                {c.weapon.type ?? "—"} • {c.weapon.rarity ?? "—"}★ • R
                                {c.weapon.refinement ?? 1} • Lv {c.weapon.level ?? "—"}
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
                {(!Array.isArray(artifacts) || artifacts.length === 0) ? (
                    <div className="subtle">No artifacts</div>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
                                        <div className="col-span-2 rounded-xl border border-black/5 dark:border-white/5 p-3 bg-black/5 dark:bg-white/5 flex flex-col min-h-[110px]">
                                            <div className="text-[10px] uppercase opacity-70">Main Stat</div>
                                            <div className="mt-1 text-sm font-medium truncate">
                                                {a.mainstat?.stat || "—"}
                                            </div>
                                            <div className="mt-auto text-2xl font-bold tabular-nums">
                                                {fmt(a.mainstat?.stat, a.mainstat?.value, a.mainstat?.isPercent)}
                                            </div>
                                        </div>

                                        <div className="col-span-3 grid grid-cols-2 gap-3">
                                            {subs4.map((s, idx) => (
                                                <div
                                                    key={idx}
                                                    className="rounded-xl border border-black/5 dark:border-white/5 p-2.5 bg-white/60 dark:bg-white/5 flex flex-col min-h-[52px]"
                                                >
                                                    <div className="text-[10px] uppercase opacity-60">
                                                        {s?.stat || "—"}
                                                    </div>
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
