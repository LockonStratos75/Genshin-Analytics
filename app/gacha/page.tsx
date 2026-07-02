"use client";

import { useEffect, useMemo, useState } from "react";
import useStore from "@/lib/store";
import { computeAllStats } from "@/lib/wishStats";
import { formatNum } from "@/lib/display";
import PityCard from "@/components/gacha/PityCard";
import WishCharts from "@/components/gacha/WishCharts";
import ImportWishes from "@/components/gacha/ImportWishes";

const BANNER_LABEL: Record<string, string> = {
  character: "Character",
  weapon: "Weapon",
  standard: "Standard",
};

export default function WishTrackerPage() {
  const wishes = useStore((s) => s.wishes);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const stats = useMemo(() => computeAllStats(hydrated ? wishes : []), [wishes, hydrated]);
  const hasData = hydrated && stats.total > 0;

  return (
    <div>
      <h1 className="page-title">Wish Tracker</h1>
      <p className="page-sub">
        Pity counters, 50/50 record, and pull history. Everything stays in your browser.
      </p>

      {!hydrated ? (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-72" />
          ))}
        </div>
      ) : !hasData ? (
        <div className="mt-6 max-w-2xl">
          <ImportWishes />
        </div>
      ) : (
        <>
          {/* Account totals */}
          <div className="card mt-6 grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
            <div>
              <div className="stat-num text-2xl font-semibold text-white">
                {formatNum(stats.total)}
              </div>
              <div className="text-xs text-mist-faint">lifetime wishes</div>
            </div>
            <div>
              <div className="stat-num text-2xl font-semibold text-white">
                {formatNum(stats.primogems)}
              </div>
              <div className="text-xs text-mist-faint">primogems spent</div>
            </div>
            <div>
              <div className="stat-num text-2xl font-semibold" style={{ color: "#ffb547" }}>
                {stats.allFive.length}
              </div>
              <div className="text-xs text-mist-faint">5★ pulls</div>
            </div>
            <div>
              <div className="stat-num text-2xl font-semibold text-white">
                {stats.total ? ((stats.allFive.length / stats.total) * 100).toFixed(2) : "0"}%
              </div>
              <div className="text-xs text-mist-faint">5★ rate</div>
            </div>
          </div>

          {/* Pity cards */}
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <PityCard stats={stats.character} />
            <PityCard stats={stats.weapon} />
            <PityCard stats={stats.standard} />
          </div>

          {/* 5-star history */}
          <section className="card mt-6 p-5">
            <h2 className="text-base font-semibold text-white">5★ history</h2>
            <p className="mt-0.5 text-xs text-mist-faint">
              Most recent first. The number is the pity it arrived on.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {stats.allFive.map((f, i) => {
                const won = f.wonFifty;
                const border =
                  won === true
                    ? "border-element-anemo/50"
                    : won === false
                      ? "border-element-pyro/50"
                      : "border-white/10";
                return (
                  <div
                    key={`${f.name}-${f.time}-${i}`}
                    className={`flex items-center gap-2 rounded-lg border ${border} bg-ink-850 px-3 py-2`}
                    title={`${f.name} · ${BANNER_LABEL[f.banner]} banner · ${new Date(
                      f.time
                    ).toLocaleDateString()}${
                      f.guaranteed ? " · guaranteed" : won === true ? " · won 50/50" : won === false ? " · lost 50/50" : ""
                    }`}
                  >
                    <span className="text-sm font-medium text-white">{f.name}</span>
                    <span
                      className={`stat-num text-xs font-semibold ${
                        f.pity <= 40
                          ? "text-element-anemo"
                          : f.pity <= 70
                            ? "text-gold-300"
                            : "text-element-pyro"
                      }`}
                    >
                      {f.pity}
                    </span>
                    {f.guaranteed && (
                      <span className="rounded-full bg-ink-950 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-mist-faint">
                        G
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {(stats.character.winRate != null || stats.weapon.winRate != null) && (
              <p className="mt-4 text-xs text-mist-faint">
                Green border means the featured character or weapon was won on a coin flip, red
                means the flip was lost. G marks a guaranteed pull.
              </p>
            )}
          </section>

          {/* Charts */}
          <div className="mt-6">
            <WishCharts wishes={wishes} />
          </div>

          {/* Import controls at the bottom once data exists */}
          <div className="mt-6">
            <ImportWishes />
          </div>
        </>
      )}
    </div>
  );
}
