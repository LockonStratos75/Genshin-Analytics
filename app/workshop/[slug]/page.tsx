// path: app/workshop/[slug]/page.tsx
import "server-only";
import type { Metadata } from "next";
import db from "@/data/workshop-db.json";

type Guide = {
    slug: string;
    name: string;
    element?: string;
    weapon_type?: string;
    ["role(s)"]?: string[];
    lore?: { short?: string };
    weapons?: Array<{
        name: string;
        rarity?: string;
        recommended_refinement?: string;
        rank?: number;
        notes?: string;
    }>;
    artifacts?: Array<{ set: string; notes?: string }>;
    main_stats?: Record<"Sands" | "Goblet" | "Circlet", string>;
    substats_priority?: string[];
    er_requirements?: Array<{ condition: string; value: string }>;
    talent_priority?: string[];
    team_comps?: Array<{ name: string; members: Array<{ name: string; role?: string }>; notes?: string }>;
    pros_cons?: { pros?: string[]; cons?: string[]; playstyle_notes?: string[] };
    materials?: { character_ascension?: string[]; talent_ascension?: string[] };
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const g = (db as Guide[]).find((x) => x.slug === params.slug);
    return { title: g ? `${g.name} • Paimon’s Workshop` : "Paimon’s Workshop" };
}

/* ---------- filename helpers (match your local .webp names) ---------- */

function toWebpFilename(display: string) {
    let x = (display || "")
        .normalize("NFKD")
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[–—-]/g, "_")
        .replace(/\s+/g, "_");
    x = x.replace(/[^A-Za-z0-9_']/g, "_");
    x = x.replace(/_+/g, "_").replace(/^_+|_+$/g, "");
    return `${x}.webp`;
}

function charIcon(name: string) {
    return `/character_imgs/${encodeURIComponent(toWebpFilename(name))}`;
}
function weaponIcon(name: string) {
    return `/weapons_imgs/${encodeURIComponent(toWebpFilename(name))}`;
}

/** Strip "2pc/4pc" etc. and split combos; then use first set name for the icon. */
function extractArtifactSetName(label: string) {
    let s = (label || "").trim();
    s = s.replace(/\b(\d+)\s*[- ]*\s*(?:pc|piece|pieces)\b/gi, "").trim();
    const first = s.split(/\s*(?:\+|\/|,|&|\band\b)\s*/i)[0]?.trim() || s;
    return first.replace(/\s{2,}/g, " ");
}
function artifactIcon(label: string) {
    const setName = extractArtifactSetName(label);
    return `/artifact_imgs/${encodeURIComponent(toWebpFilename(setName))}`;
}

/* ---------- team member name → icon resolver (handles short/alias/combined) ---------- */

const CHAR_ALIASES: Record<string, string> = {
    // Archons / multi-word
    "raiden": "Raiden Shogun",
    "shogun": "Raiden Shogun",
    "ei": "Raiden Shogun",
    "yae": "Yae Miko",
    "nahida": "Nahida",
    "zhongli": "Zhongli",
    "venti": "Venti",
    "furina": "Furina",
    "focalors": "Furina",

    // First-name → full-name
    "sara": "Kujou Sara",
    "kazu": "Kaedehara Kazuha",
    "kazuha": "Kaedehara Kazuha",
    "ayaka": "Kamisato Ayaka",
    "ayato": "Kamisato Ayato",
    "kokomi": "Sangonomiya Kokomi",
    "heizou": "Shikanoin Heizou",
    "shinobu": "Kuki Shinobu",
    "itto": "Arataki Itto",
    "hutao": "Hu Tao",
    "hu tao": "Hu Tao",
    "scaramouche": "Wanderer",
    "wanderer": "Wanderer",
    "childe": "Tartaglia",

    // Common short names/alts that already match
    "xingqiu": "Xingqiu",
    "yelan": "Yelan",
    "bennett": "Bennett",
    "baizhu": "Baizhu",
    "yaoyao": "Yaoyao",
    "sara c6 preferred": "Kujou Sara",
};

function titleCase(s: string) {
    return s
        .toLowerCase()
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
        .join(" ");
}

/**
 * Given something like "Xingqiu/Yelan", "Sara (C6 preferred)", "Raiden (EM build)",
 * return a local image path that most likely exists.
 */
function teamMemberIcon(raw: string) {
    const base = (raw || "")
        .replace(/\([^)]*\)/g, " ") // strip (...) notes
        .replace(/\s+/g, " ")
        .trim();

    // Try first candidate among split tokens
    const candidates = base.split(/\s*(?:\/|,|\+|&|\band\b|\bor\b)\s*/i).filter(Boolean);

    for (const cand of candidates) {
        const key = cand.toLowerCase().trim();
        const mapped = CHAR_ALIASES[key] || CHAR_ALIASES[key.replace(/\s+/g, " ")] || undefined;

        const canonical = mapped || titleCase(cand.trim());

        // Prefer canonical directly
        return charIcon(canonical);
    }

    // Fallback: original raw name normalized (unlikely to exist, but safe)
    return charIcon(titleCase(base));
}

function pill(s: string) {
    return (
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs">
      {s}
    </span>
    );
}

/* ------------------------------ page ------------------------------ */

export default async function Page({ params }: { params: { slug: string } }) {
    const guides = db as Guide[];
    const g = guides.find((x) => x.slug === params.slug);
    if (!g) {
        return (
            <div className="p-6">
                <h1 className="text-xl font-semibold">Not found</h1>
                <p className="opacity-70 mt-1">There’s no guide for “{params.slug}”.</p>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {/* Header */}
            <header className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                    <h1 className="text-3xl font-semibold">{g.name}</h1>
                    {g.lore?.short ? <p className="opacity-80 mt-2 max-w-2xl">{g.lore.short}</p> : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                        {g.element ? pill(g.element) : null}
                        {g.weapon_type ? pill(g.weapon_type) : null}
                        {(g["role(s)"] ?? []).map((r) => (
                            <span key={r}>{pill(r)}</span>
                        ))}
                    </div>
                </div>

                <img
                    src={charIcon(g.name)}
                    alt={g.name}
                    className="h-20 w-20 rounded-2xl object-cover border border-white/10 bg-white/5"
                />
            </header>

            {/* Weapons */}
            {!!g.weapons?.length && (
                <section id="weapons" className="space-y-4">
                    <h2 className="text-xl font-semibold">Best Weapons (1→5)</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {g.weapons
                            .slice()
                            .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
                            .map((w) => (
                                <div
                                    key={`${w.rank}-${w.name}`}
                                    className="flex gap-3 rounded-2xl border border-white/5 bg-white/5 p-4"
                                >
                                    <img src={weaponIcon(w.name)} alt={w.name} className="h-12 w-12 rounded-xl object-cover" />
                                    <div className="min-w-0">
                                        <div className="font-medium">
                                            {w.rank ? `${w.rank}. ` : ""}
                                            {w.name}{" "}
                                            <span className="text-xs opacity-70 ml-1">{w.rarity ?? ""}</span>
                                            {w.recommended_refinement ? (
                                                <span className="text-[10px] ml-2 rounded px-1.5 py-0.5 bg-white/10">
                          Ref {w.recommended_refinement}
                        </span>
                                            ) : null}
                                        </div>
                                        {w.notes ? <div className="opacity-80 text-sm">{w.notes}</div> : null}
                                    </div>
                                </div>
                            ))}
                    </div>
                </section>
            )}

            {/* Artifacts */}
            {!!g.artifacts?.length && (
                <section id="artifacts" className="space-y-4">
                    <h2 className="text-xl font-semibold">Best Artifact Sets (1→5)</h2>

                    {(g.main_stats || g.substats_priority || g.er_requirements) && (
                        <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                            <div className="font-medium">Stat Priority</div>
                            <div className="mt-2 grid gap-2 sm:grid-cols-3">
                                {g.main_stats ? (
                                    <>
                                        <div>
                                            <div className="text-xs opacity-60">Sands</div>
                                            <div className="text-sm font-medium">{g.main_stats.Sands}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs opacity-60">Goblet</div>
                                            <div className="text-sm font-medium">{g.main_stats.Goblet}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs opacity-60">Circlet</div>
                                            <div className="text-sm font-medium">{g.main_stats.Circlet}</div>
                                        </div>
                                    </>
                                ) : null}
                            </div>
                            {g.substats_priority?.length ? (
                                <div className="mt-3 text-sm">
                                    <span className="opacity-60 mr-1">Substats:</span>
                                    {g.substats_priority.join(" → ")}
                                </div>
                            ) : null}
                            {g.er_requirements?.length ? (
                                <div className="mt-2 space-y-1">
                                    {g.er_requirements.map((e) => (
                                        <div key={e.condition} className="text-sm">
                                            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] mr-2">ER</span>
                                            <span className="font-medium">{e.value}</span>
                                            <span className="opacity-70 ml-2">— {e.condition}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        {g.artifacts.map((a, i) => {
                            const iconSrc = artifactIcon(a.set);
                            return (
                                <div key={`${i}-${a.set}`} className="flex gap-3 rounded-2xl border border-white/5 bg-white/5 p-4">
                                    <img src={iconSrc} alt={a.set} className="h-12 w-12 rounded-xl object-cover" />
                                    <div className="min-w-0">
                                        <div className="font-medium">{`${i + 1}. ${a.set}`}</div>
                                        {a.notes ? <div className="opacity-80 text-sm">{a.notes}</div> : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Teams (with robust icon resolver) */}
            {!!g.team_comps?.length && (
                <section id="teams" className="space-y-4">
                    <h2 className="text-xl font-semibold">Best Team Compositions</h2>
                    <div className="grid gap-4">
                        {g.team_comps.map((t) => (
                            <div key={t.name} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                                <div className="font-medium">{t.name}</div>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    {t.members.map((m, idx) => (
                                        <div key={`${t.name}-${m.name}-${idx}`} className="flex items-center gap-3">
                                            <img
                                                src={teamMemberIcon(m.name)}
                                                alt={m.name}
                                                className="h-9 w-9 rounded-lg object-cover border border-white/10 bg-white/5"
                                            />
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium">{m.name}</div>
                                                {m.role ? <div className="text-xs opacity-70">{m.role}</div> : null}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {t.notes ? <div className="opacity-80 text-sm mt-3">{t.notes}</div> : null}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Pros/Cons & Materials */}
            {(g.pros_cons?.pros?.length || g.pros_cons?.cons?.length) && (
                <section id="proscons" className="space-y-4">
                    <h2 className="text-xl font-semibold">Pros & Cons</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                            <div className="font-medium mb-2">Pros</div>
                            <ul className="list-disc pl-5 space-y-1">
                                {(g.pros_cons?.pros ?? []).map((p) => <li key={p}>{p}</li>)}
                            </ul>
                        </div>
                        <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                            <div className="font-medium mb-2">Cons</div>
                            <ul className="list-disc pl-5 space-y-1">
                                {(g.pros_cons?.cons ?? []).map((c) => <li key={c}>{c}</li>)}
                            </ul>
                        </div>
                    </div>
                    {g.pros_cons?.playstyle_notes?.length ? (
                        <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                            <div className="font-medium mb-2">Tips & Rotations</div>
                            <ul className="list-disc pl-5 space-y-1">
                                {g.pros_cons.playstyle_notes.map((n) => <li key={n}>{n}</li>)}
                            </ul>
                        </div>
                    ) : null}
                </section>
            )}

            {(g.materials?.character_ascension?.length || g.materials?.talent_ascension?.length) && (
                <section id="materials" className="space-y-4">
                    <h2 className="text-xl font-semibold">Ascension & Materials</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                            <div className="font-medium mb-2">Character Ascension</div>
                            <ul className="list-disc pl-5 space-y-1">
                                {(g.materials?.character_ascension ?? []).map((m) => <li key={m}>{m}</li>)}
                            </ul>
                        </div>
                        <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                            <div className="font-medium mb-2">Talent Materials</div>
                            <ul className="list-disc pl-5 space-y-1">
                                {(g.materials?.talent_ascension ?? []).map((m) => <li key={m}>{m}</li>)}
                            </ul>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
