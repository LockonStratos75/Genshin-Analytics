"use client";
import useStore from "@/lib/store";

export default function QuickStats() {
  const { characters, artifactAvgScore, fiveStarRate, last10 } = useStore(s => s.stats);
  return (
    <div className="card p-5 md:col-span-2">
      <h2 className="text-xl font-semibold mb-3">Quick Stats</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div className="p-3 rounded-lg bg-white/70 dark:bg-white/10">
          <div className="subtle">Total Characters</div>
          <div className="text-2xl font-semibold">{characters ?? "—"}</div>
        </div>
        <div className="p-3 rounded-lg bg-white/70 dark:bg-white/10">
          <div className="subtle">Avg Artifact Score</div>
          <div className="text-2xl font-semibold">{artifactAvgScore ?? "—"}</div>
        </div>
        <div className="p-3 rounded-lg bg-white/70 dark:bg-white/10">
          <div className="subtle">5★ Pull Rate</div>
          <div className="text-2xl font-semibold">{fiveStarRate ?? "—"}</div>
        </div>
        <div className="p-3 rounded-lg bg-white/70 dark:bg-white/10">
          <div className="subtle">Last 10 Pulls</div>
          <div className="text-2xl font-semibold">{last10 ?? "—"}</div>
        </div>
      </div>
    </div>
  );
}
