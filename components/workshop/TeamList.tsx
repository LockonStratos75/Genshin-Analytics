// path: components/workshop/TeamList.tsx
"use client";
import MultiSourceImg from "@/components/MultiSourceImg";

type Member = { name: string; role?: string; icon?: string; iconCandidates?: string[] };
type TeamComp = { name: string; members: Member[]; notes?: string };

export default function TeamList({ teams }: { teams?: TeamComp[] }) {
    if (!teams?.length) return <p className="opacity-60">—</p>;

    const copy = (t: TeamComp) =>
        navigator.clipboard.writeText(t.members.map((m) => m.name).join(" / ")).catch(() => {});

    return (
        <div className="grid gap-4">
            {teams.map((t, i) => (
                <div key={i} className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-sm p-4">
                    <div className="flex items-center justify-between">
                        <div className="font-semibold">{t.name}</div>
                        <button
                            className="text-xs px-2 py-1 rounded bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/15 transition"
                            onClick={() => copy(t)}
                        >
                            Copy Team
                        </button>
                    </div>
                    <div className="mt-3 grid sm:grid-cols-2 gap-3">
                        {t.members.map((m, j) => (
                            <div key={j} className="flex items-center gap-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-2.5">
                                <MultiSourceImg
                                    srcs={m.iconCandidates ?? (m.icon ? [m.icon] : [])}
                                    alt={m.name}
                                    width={36}
                                    height={36}
                                    className="rounded-lg"
                                />
                                <div className="min-w-0">
                                    <div className="text-sm font-medium truncate">{m.name}</div>
                                    {m.role ? <div className="text-xs opacity-70">{m.role}</div> : null}
                                </div>
                            </div>
                        ))}
                    </div>
                    {t.notes ? <div className="text-sm opacity-70 mt-3">{t.notes}</div> : null}
                </div>
            ))}
        </div>
    );
}
