// components/workshop/WorkshopSearch.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import MultiSourceImg from "@/components/MultiSourceImg";

type Guide = any;

const ELEMENTS = ["Pyro","Hydro","Electro","Cryo","Anemo","Geo","Dendro"] as const;
const WEAPONS  = ["Sword","Claymore","Polearm","Bow","Catalyst"] as const;

export default function WorkshopSearch() {
    const [q, setQ] = React.useState("");
    const [el, setEl] = React.useState<string>("");
    const [wp, setWp] = React.useState<string>("");
    const [role, setRole] = React.useState<string>("");
    const [items, setItems] = React.useState<Guide[] | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            const res = await fetch("/api/workshop", { cache: "no-store" });
            const data = res.ok ? await res.json() : [];
            if (alive) { setItems(data); setLoading(false); }
        })();
        return () => { alive = false; };
    }, []);

    const filtered = React.useMemo(() => {
        const src = items ?? [];
        const needle = q.trim().toLowerCase();
        return src.filter((g: any) => {
            if (el && String(g.element).toLowerCase() !== el.toLowerCase()) return false;
            if (wp && String(g.weapon_type).toLowerCase() !== wp.toLowerCase()) return false;
            if (role && !((g["role(s)"] || []).some((r: string) => r.toLowerCase().includes(role.toLowerCase())))) return false;
            if (!needle) return true;
            return (
                g.name.toLowerCase().includes(needle) ||
                g.slug.toLowerCase().includes(needle) ||
                (g["role(s)"] || []).some((r: string) => r.toLowerCase().includes(needle))
            );
        });
    }, [items, q, el, wp, role]);

    return (
        <div>
            {/* Filters */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <input
                    className="rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-2"
                    placeholder="Search characters, roles…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />
                <select className="rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-2"
                        value={el} onChange={(e) => setEl(e.target.value)}>
                    <option value="">All elements</option>
                    {ELEMENTS.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
                <select className="rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-2"
                        value={wp} onChange={(e) => setWp(e.target.value)}>
                    <option value="">All weapon types</option>
                    {WEAPONS.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
                <input
                    className="rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-2"
                    placeholder="Role contains… (e.g. Hyperbloom)"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                />
            </div>

            <div className="mt-6">
                {loading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-28 rounded-2xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : !filtered.length ? (
                    <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6 text-sm opacity-70">
                        No results. Try another name or remove filters.
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((g: any) => (
                            <Link
                                key={g.slug}
                                href={`/workshop/${g.slug}`}
                                className="group rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-sm p-4 flex items-center gap-3 hover:shadow-md hover:border-black/20 dark:hover:border-white/20 transition"
                            >
                                <MultiSourceImg
                                    srcs={g.iconCandidates ?? []}
                                    alt={g.name}
                                    width={56}
                                    height={56}
                                    className="w-14 h-14 rounded-xl object-cover"
                                />
                                <div className="min-w-0">
                                    <div className="font-semibold leading-tight">{g.name}</div>
                                    <div className="text-xs opacity-70">{g.element} • {g.weapon_type}</div>
                                    <div className="mt-1 flex flex-wrap gap-1.5">
                                        {(g["role(s)"] || []).slice(0, 3).map((r: string, i: number) => (
                                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10">
                        {r}
                      </span>
                                        ))}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
