"use client";

import { useMemo, useState } from "react";
import useStore from "@/lib/store";
import { scoreArtifact, critRV, rollsEstimate } from "@/lib/scoring";

type Sub = { stat?: string; value?: number; isPercent?: boolean };
type Main = { stat?: string; value?: number; isPercent?: boolean };

type A = {
  id?: string;
  set?: string;
  rarity?: number | null;
  level?: number | null;
  slot?: string;
  mainstat?: Main;
  substats?: Sub[];
  icon?: string | null;
};

/* ---------- stat helpers ---------- */

function norm(s?: string) {
  const x = String(s || "").trim();
  return x
      .replace(/Elemental Mastery/i, "EM")
      .replace(/Energy Recharge/i, "ER")
      .replace(/CRIT Rate/i, "CR")
      .replace(/CRIT DMG/i, "CD")
      .replace(/(?<=^| )HP%?/i, (m) => (m.includes("%") ? "HP%" : "HP"))
      .replace(/(?<=^| )ATK%?/i, (m) => (m.includes("%") ? "ATK%" : "ATK"))
      .replace(/(?<=^| )DEF%?/i, (m) => (m.includes("%") ? "DEF%" : "DEF"));
}

function isPercentStat(stat?: string) {
  const k = norm(stat);
  return !!k && ["HP%", "ATK%", "DEF%", "CR", "CD", "ER"].includes(k);
}

function fmtValue(stat?: string, value?: number, hint?: boolean) {
  if (value == null || Number.isNaN(value)) return "—";
  const isPct = typeof hint === "boolean" ? hint : isPercentStat(stat);
  const v = isPct && value > 0 && value < 1 ? value * 100 : value;
  return isPct ? `${v.toFixed(1)}%` : `${v}`;
}

const Abbrev: Record<string, string> = {
  HP: "HP",
  "HP%": "HP%",
  ATK: "ATK",
  "ATK%": "ATK%",
  DEF: "DEF",
  "DEF%": "DEF%",
  EM: "EM",
  ER: "ER",
  CR: "CR",
  CD: "CD",
};

function label(stat?: string) {
  const k = norm(stat || "");
  return Abbrev[k] || (stat || "—");
}

/* ------------------------- main component ------------------------- */

export default function ArtifactGrid() {
  const characters = useStore((s) => s.characters);
  const artifactsRaw = useStore((s) => s.artifacts);

  const artifacts: A[] = useMemo(() => {
    const fromTop = (artifactsRaw || []).filter(Boolean) as A[];
    if (fromTop.length) return fromTop;
    const list: A[] = [];
    for (const ch of characters || []) {
      for (const a of ch?.artifacts || []) if (a) list.push(a);
    }
    return list;
  }, [artifactsRaw, characters]);

  const [setName, setSetName] = useState("");
  const sets = useMemo(
      () =>
          Array.from(new Set(artifacts.map((a) => a?.set).filter(Boolean) as string[])),
      [artifacts]
  );
  const filtered = useMemo(
      () => artifacts.filter((a) => !setName || a?.set === setName),
      [artifacts, setName]
  );

  return (
      <div className="card p-4">
        <div className="flex gap-3 mb-4 items-center">
          <select
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/10 bg-transparent"
          >
            <option value="">All sets</option>
            {sets.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
            ))}
          </select>
          <span className="subtle ml-auto">{filtered.length} pieces</span>
        </div>

        {filtered.length === 0 ? (
            <p className="subtle">Fetch via Enka to populate artifacts.</p>
        ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((a, i) => {
                const subs: Sub[] = Array.isArray(a?.substats) ? a.substats! : [];
                const subs4: (Sub | null)[] = [...subs];
                while (subs4.length < 4) subs4.push(null);

                const main = a?.mainstat || {};
                const rv = critRV(subs);
                const score = scoreArtifact(subs);

                const stars = a?.rarity ? Array(a.rarity).fill("★").join("") : "—";

                return (
                    <div
                        key={`${a.id || i}-${a.slot}-${a.level}`}
                        className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-sm hover:shadow-lg transition-shadow p-5"
                    >
                      {/* header */}
                      <div className="flex items-center gap-3">
                        {a?.icon ? (
                            <img
                                src={a.icon}
                                alt=""
                                className="w-14 h-14 rounded-xl object-cover ring-1 ring-black/10 dark:ring-white/10"
                            />
                        ) : (
                            <div className="w-14 h-14 rounded-xl bg-black/10 dark:bg-white/10" />
                        )}
                        <div className="min-w-0">
                          <div className="text-base font-semibold truncate">
                            {a?.set || "Unknown Set"}
                          </div>
                          <div className="text-xs opacity-70">
                            {a?.slot ?? "—"} • <span className="text-amber-500">{stars}</span> • +{a?.level ?? 0}
                          </div>
                        </div>
                        <div className="ml-auto text-right">
                          <div className="text-[10px] uppercase opacity-60">RV</div>
                          <div className="text-sm font-semibold">{rv.toFixed(1)}</div>
                        </div>
                      </div>

                      {/* body */}
                      <div className="mt-4 grid grid-cols-5 gap-4 items-stretch">
                        <div className="col-span-2 rounded-xl border border-black/5 dark:border-white/5 p-3 bg-black/5 dark:bg-white/5 flex flex-col min-h-[112px]">
                          <div className="text-[10px] uppercase opacity-70">Main Stat</div>
                          <div className="mt-1 text-sm font-medium truncate">{main?.stat || "—"}</div>
                          <div className="mt-auto text-2xl font-bold tabular-nums">
                            {fmtValue(main?.stat, main?.value, main?.isPercent)}
                          </div>
                        </div>

                        <div className="col-span-3 grid grid-cols-2 gap-3">
                          {subs4.map((s, idx) => {
                            const v = s ? fmtValue(s.stat, s.value, s.isPercent) : "";
                            const rolls =
                                s && Number.isFinite(s.value)
                                    ? `${rollsEstimate(s.stat, s.value).toFixed(1)}r`
                                    : "";
                            return (
                                <div
                                    key={idx}
                                    className="rounded-xl border border-black/5 dark:border-white/5 p-2.5 bg-white/60 dark:bg-white/5 flex flex-col min-h-[52px]"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="text-[10px] uppercase opacity-60">{label(s?.stat)}</div>
                                    <div className="ml-auto text-[10px] opacity-50">{rolls}</div>
                                  </div>
                                  <div className="mt-1 text-sm font-semibold tabular-nums">{s ? v : "—"}</div>
                                </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* footer */}
                      <div className="mt-3 text-xs opacity-70">
                        Score: <span className="font-medium opacity-90">{score.toFixed(1)}</span>
                      </div>
                    </div>
                );
              })}
            </div>
        )}
      </div>
  );
}
