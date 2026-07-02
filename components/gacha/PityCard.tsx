"use client";

import type { BannerStats } from "@/lib/wishStats";
import { formatNum } from "@/lib/display";

const BANNER_META: Record<string, { label: string; color: string }> = {
  character: { label: "Character Event", color: "#e8bc66" },
  weapon: { label: "Weapon Event", color: "#b48fff" },
  standard: { label: "Standard", color: "#54c8f0" },
};

export default function PityCard({ stats }: { stats: BannerStats }) {
  const meta = BANNER_META[stats.banner];
  const pct = Math.min(100, (stats.currentPity / stats.hardPity) * 100);
  const softPct = (stats.softPity / stats.hardPity) * 100;
  const inSoft = stats.currentPity >= stats.softPity;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: meta.color }}>
          {meta.label}
        </span>
        {stats.banner !== "standard" && stats.fiveStars.length > 0 && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              stats.guaranteed
                ? "bg-gold-500/15 text-gold-300"
                : "bg-ink-800 text-mist-dim"
            }`}
          >
            {stats.guaranteed ? "Next 5★ guaranteed featured" : "Next 5★ is a 50/50"}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-end gap-2">
        <span className="stat-num text-5xl font-semibold leading-none text-white">
          {stats.currentPity}
        </span>
        <span className="stat-num pb-1 text-sm text-mist-faint">/ {stats.hardPity} pity</span>
      </div>

      {/* progress with soft pity marker */}
      <div className="relative mt-4 h-2 rounded-full bg-ink-800">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: inSoft ? "#ffb547" : meta.color,
          }}
        />
        <div
          className="absolute -top-1 bottom-[-4px] w-px bg-white/30"
          style={{ left: `${softPct}%` }}
          title={`Soft pity begins at ${stats.softPity}`}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-mist-faint">
        <span>{inSoft ? "In soft pity range" : `Soft pity at ${stats.softPity}`}</span>
        <span className="stat-num">4★ pity {stats.currentPity4}/10</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-4 text-center">
        <div>
          <div className="stat-num text-base font-medium text-white">{formatNum(stats.total)}</div>
          <div className="text-[11px] text-mist-faint">wishes</div>
        </div>
        <div>
          <div className="stat-num text-base font-medium" style={{ color: "#ffb547" }}>
            {stats.fiveStars.length}
          </div>
          <div className="text-[11px] text-mist-faint">5★ pulls</div>
        </div>
        <div>
          <div className="stat-num text-base font-medium text-white">
            {stats.avgPity != null ? stats.avgPity.toFixed(1) : "-"}
          </div>
          <div className="text-[11px] text-mist-faint">avg 5★ pity</div>
        </div>
      </div>

      {stats.winRate != null && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-ink-950/50 px-3 py-2 text-xs">
          <span className="text-mist-dim">
            {stats.banner === "character" ? "50/50 win rate" : "75/25 win rate"}
          </span>
          <span className="stat-num font-semibold text-white">{stats.winRate.toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
}
