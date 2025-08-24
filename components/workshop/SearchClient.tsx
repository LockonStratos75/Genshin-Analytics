// path: components/workshop/SearchClient.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import type { GuideSummary } from "@/lib/workshop-types";

type Filters = {
    q: string;
    element: string;
    weapon: string;
    role: string;
};

const ELEMENTS = ["All","Pyro","Hydro","Electro","Cryo","Anemo","Geo","Dendro"] as const;
const WEAPONS = ["All","Sword","Claymore","Polearm","Bow","Catalyst"] as const;

export default function SearchClient({ initial }: { initial: GuideSummary[] }) {
    const [data, setData] = React.useState<GuideSummary[]>(initial);
    const [filters, setFilters] = React.useState<Filters>({ q: "", element: "All", weapon: "All", role: "All" });

    // refresh from API (hot-reload-safe)
    React.useEffect(() => {
        fetch("/api/workshop")
            .then((r) => r.json())
            .then((j) => setData(j))
            .catch(() => {});
    }, []);

    const q = filters.q.trim().toLowerCase();
    const res = data.filter((d) => {
        const matchesQ =
            !q ||
            d.name.toLowerCase().includes(q) ||
            d.slug.toLowerCase().includes(q) ||
            (d.roles || []).some((r) => r.toLowerCase().includes(q));
        const matchesEl = filters.element === "All" || d.element === filters.element;
        const matchesWeap = filters.weapon === "All" || d.weapon_type === filters.weapon;
        const matchesRole = filters.role === "All" || (d.roles || []).some((r) => r.toLowerCase().includes(filters.role.toLowerCase()));
        return matchesQ && matchesEl && matchesWeap && matchesRole;
    });

    const onChange = <K extends keyof Filters,>(k: K, v: Filters[K]) => setFilters((s) => ({ ...s, [k]: v }));

    return (
        <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
                <input
                    placeholder="Search character… e.g., Raiden Shogun"
                    value={filters.q}
                    onChange={(e) => onChange("q", e.target.value)}
                    className="rounded-xl bg-neutral-900/60 px-4 py-2 outline-none focus:ring-2 ring-purple-500"
                />
                <select value={filters.element} onChange={(e) => onChange("element", e.target.value)} className="rounded-xl bg-neutral-900/60 px-3 py-2">
                    {ELEMENTS.map((x) => <option key={x}>{x}</option>)}
                </select>
                <select value={filters.weapon} onChange={(e) => onChange("weapon", e.target.value)} className="rounded-xl bg-neutral-900/60 px-3 py-2">
                    {WEAPONS.map((x) => <option key={x}>{x}</option>)}
                </select>
                <input
                    placeholder="Filter by role (e.g. hypercarry)"
                    value={filters.role === "All" ? "" : filters.role}
                    onChange={(e) => onChange("role", e.target.value || "All")}
                    className="rounded-xl bg-neutral-900/60 px-4 py-2 outline-none focus:ring-2 ring-purple-500"
                />
            </div>

            {res.length === 0 ? (
                <div className="text-center text-sm text-neutral-400 py-12">No results. Try different filters.</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {res.map((c) => (
                        <Link
                            key={c.slug}
                            href={`/workshop/${c.slug}`}
                            className="rounded-2xl bg-neutral-900/60 hover:bg-neutral-900/80 transition shadow-sm p-4 flex items-center gap-4"
                        >
                            <img
                                src={`https://genshin.jmp.blue/characters/${c.slug}/icon-big`}
                                alt={c.name}
                                width={56}
                                height={56}
                                className="rounded-lg"
                            />
                            <div className="min-w-0">
                                <div className="font-semibold truncate">{c.name}</div>
                                <div className="text-xs text-neutral-400 mt-0.5">
                                    {c.element} • {c.weapon_type}
                                </div>
                                {c.roles?.length ? (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {c.roles.slice(0, 3).map((r, i) => (
                                            <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-neutral-800/70">{r}</span>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
