"use client";
import useStore from "@/lib/store";

export default function PityWidget() {
    const pity = useStore((s) => s.pity) ?? { character: 0, weapon: 0, standard: 0 };

    return (
        <div className="card p-5">
            <h2 className="text-xl font-semibold mb-3">Pity Tracker</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-white/70 dark:bg-white/10">
                    <div className="subtle">Event Character</div>
                    <div className="text-2xl font-semibold">{pity.character ?? "—"}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/70 dark:bg-white/10">
                    <div className="subtle">Event Weapon</div>
                    <div className="text-2xl font-semibold">{pity.weapon ?? "—"}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/70 dark:bg-white/10">
                    <div className="subtle">Standard</div>
                    <div className="text-2xl font-semibold">{pity.standard ?? "—"}</div>
                </div>
            </div>
            <p className="text-xs opacity-70 mt-2">Upload wish history in Gacha tab to auto-calc.</p>
        </div>
    );
}
