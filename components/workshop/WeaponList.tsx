// path: components/workshop/WeaponList.tsx
"use client";
import MultiSourceImg from "@/components/MultiSourceImg";

type WeaponEntry = {
    name: string;
    rank?: number;
    rarity?: string | number;
    recommended_refinement?: string;
    notes?: string;
    icon?: string;
    iconCandidates?: string[];
};

export default function WeaponList({ items }: { items?: WeaponEntry[] }) {
    if (!items?.length) return <p className="opacity-60">—</p>;
    return (
        <div className="grid gap-4 md:grid-cols-2">
            {items
                .slice()
                .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
                .map((w) => (
                    <div
                        key={`${w.rank}-${w.name}`}
                        className="rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-white/70 dark:bg-white/5 backdrop-blur-sm flex gap-3"
                    >
                        <MultiSourceImg
                            srcs={w.iconCandidates ?? (w.icon ? [w.icon] : [])}
                            alt={w.name}
                            width={48}
                            height={48}
                            className="rounded-xl"
                        />
                        <div className="min-w-0">
                            <div className="font-semibold">
                                {w.rank ? `${w.rank}. ` : ""}{w.name}
                                {w.rarity ? (
                                    <span className="text-xs ml-2 px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10">
                    {typeof w.rarity === "number" ? `${w.rarity}★` : w.rarity}
                  </span>
                                ) : null}
                                {w.recommended_refinement ? (
                                    <span className="text-xs ml-2 px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10">
                    Ref {w.recommended_refinement}
                  </span>
                                ) : null}
                            </div>
                            {w.notes ? <div className="text-sm opacity-70 mt-1">{w.notes}</div> : null}
                        </div>
                    </div>
                ))}
        </div>
    );
}
