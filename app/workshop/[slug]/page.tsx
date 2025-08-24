// path: app/workshop/[slug]/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import db from '@/data/workshop-db.json';

type Guide = {
    slug: string;
    name: string;
    element?: string;
    weapon_type?: string;
    ['role(s)']?: string[];
    lore?: { short?: string };
    weapons?: Array<{ name: string; rarity?: string; recommended_refinement?: string; rank?: number; notes?: string }>;
    artifacts?: Array<{ set: string; notes?: string }>;
    main_stats?: Record<'Sands' | 'Goblet' | 'Circlet', string>;
    substats_priority?: string[];
    er_requirements?: Array<{ condition: string; value: string }>;
    talent_priority?: string[];
    team_comps?: Array<{ name: string; members: Array<{ name: string; role?: string }>; notes?: string }>;
    pros_cons?: { pros?: string[]; cons?: string[]; playstyle_notes?: string[] };
    materials?: { character_ascension?: string[]; talent_ascension?: string[] };
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const g = (db as Guide[]).find((x) => x.slug === params.slug);
    return { title: g ? `${g.name} • Paimon’s Workshop` : 'Paimon’s Workshop' };
}

function pill(s: string) {
    return (
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs">
      {s}
    </span>
    );
}

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

    const characterIconSrc = `/api/workshop/image?q=${encodeURIComponent(`${g.name} icon genshin impact wiki`)}`;

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
                        {(g['role(s)'] ?? []).map((r) => <span key={r}>{pill(r)}</span>)}
                    </div>
                </div>
                <img
                    src={characterIconSrc}
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
                            .map((w) => {
                                const iconSrc = `/api/workshop/image?q=${encodeURIComponent(`${w.name} weapon icon genshin impact wiki`)}`;
                                return (
                                    <div
                                        key={`${w.rank}-${w.name}`}
                                        className="flex gap-3 rounded-2xl border border-white/5 bg-white/5 p-4"
                                    >
                                        <img src={iconSrc} alt={w.name} className="h-12 w-12 rounded-xl object-cover" />
                                        <div className="min-w-0">
                                            <div className="font-medium">
                                                {w.rank ? `${w.rank}. ` : ''}
                                                {w.name}{' '}
                                                <span className="text-xs opacity-70 ml-1">{w.rarity ?? ''}</span>
                                                {w.recommended_refinement ? (
                                                    <span className="text-[10px] ml-2 rounded px-1.5 py-0.5 bg-white/10">
                            Ref {w.recommended_refinement}
                          </span>
                                                ) : null}
                                            </div>
                                            {w.notes ? <div className="opacity-80 text-sm">{w.notes}</div> : null}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </section>
            )}

            {/* Artifacts */}
            {!!g.artifacts?.length && (
                <section id="artifacts" className="space-y-4">
                    <h2 className="text-xl font-semibold">Best Artifact Sets (1→5)</h2>

                    {/* Stat priority box */}
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
                                    {g.substats_priority.join(' → ')}
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
                            const artIcon = `/api/workshop/image?q=${encodeURIComponent(
                                `${a.set} artifact flower icon genshin impact wiki`,
                            )}`;
                            return (
                                <div key={`${i}-${a.set}`} className="flex gap-3 rounded-2xl border border-white/5 bg-white/5 p-4">
                                    <img src={artIcon} alt={a.set} className="h-12 w-12 rounded-xl object-cover" />
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

            {/* Teams */}
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
                                                src={`/api/workshop/image?q=${encodeURIComponent(`${m.name} icon genshin impact wiki`)}`}
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

            {/* Pros & Cons */}
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

            {/* Materials */}
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
