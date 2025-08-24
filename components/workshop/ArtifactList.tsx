// path: components/workshop/ArtifactList.tsx
"use client";
import MultiSourceImg from "@/components/MultiSourceImg";

type ArtifactEntry = { set: string; notes?: string; icon?: string; iconCandidates?: string[] };
type ERNeed = { condition: string; value: string };

export default function ArtifactList({
                                         artifacts,
                                         mainStats,
                                         substats,
                                         er,
                                     }: {
    artifacts?: ArtifactEntry[];
    mainStats?: Record<string, string>;
    substats?: string[];
    er?: ERNeed[];
}) {
    return (
        <div className="space-y-4">
            {(mainStats || substats?.length || er?.length) && (
                <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-sm p-4">
                    <div className="font-semibold mb-2">Stat Priority</div>
                    {mainStats ? (
                        <ul className="text-sm grid md:grid-cols-3 gap-3">
                            {Object.entries(mainStats).map(([k, v]) => (
                                <li key={k}>
                  <span className="text-xs px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 mr-2">
                    {k}
                  </span>
                                    {v}
                                </li>
                            ))}
                        </ul>
                    ) : null}
                    {substats?.length ? (
                        <div className="text-sm opacity-70 mt-2">Substats: {substats.join(" → ")}</div>
                    ) : null}
                    {er?.length ? (
                        <div className="text-sm opacity-70 mt-2 space-y-1">
                            {er.map((x, i) => (
                                <div key={i}>
                  <span className="text-xs px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 mr-2">
                    ER
                  </span>
                                    <span className="font-medium">{x.value}</span> — {x.condition}
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
            )}

            {artifacts?.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {artifacts.map((a, i) => (
                        <div
                            key={`${i}-${a.set}`}
                            className="rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-white/70 dark:bg-white/5 backdrop-blur-sm flex gap-3"
                        >
                            <MultiSourceImg
                                srcs={a.iconCandidates ?? (a.icon ? [a.icon] : [])}
                                alt={a.set}
                                width={48}
                                height={48}
                                className="rounded-xl"
                            />
                            <div className="min-w-0">
                                <div className="font-semibold">{i + 1}. {a.set}</div>
                                {a.notes ? <div className="text-sm opacity-70 mt-1">{a.notes}</div> : null}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="opacity-60">—</p>
            )}
        </div>
    );
}
