"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import useStore from "@/lib/store";
import type { ArtifactSetSummary } from "@/lib/gamedata";
import { rarityColor } from "@/lib/display";
import { critRV, scoreArtifact } from "@/lib/scoring";

export default function ArtifactsBrowser({ sets }: { sets: ArtifactSetSummary[] }) {
  const [tab, setTab] = useState<"all" | "mine">("all");
  const characters = useStore((s) => s.characters);
  const storeArtifacts = useStore((s) => s.artifacts);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const myArtifacts = useMemo(() => {
    if (storeArtifacts?.length) return storeArtifacts;
    const out: any[] = [];
    for (const ch of characters || []) {
      for (const a of ch?.artifacts || []) out.push({ ...a, holder: ch?.name });
    }
    return out;
  }, [storeArtifacts, characters]);

  const [q, setQ] = useState("");
  const [rarity, setRarity] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return sets.filter(
      (s) =>
        (!needle ||
          s.name.toLowerCase().includes(needle) ||
          (s.bonus2 ?? "").toLowerCase().includes(needle) ||
          (s.bonus4 ?? "").toLowerCase().includes(needle)) &&
        (!rarity || s.maxRarity === rarity)
    );
  }, [sets, q, rarity]);

  return (
    <div className="mt-6">
      <div className="flex items-center gap-1 border-b border-white/[0.07]">
        {(
          [
            ["all", `Sets (${sets.length})`],
            ["mine", `My Artifacts (${hydrated ? myArtifacts.length : 0})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === key ? "text-gold-300" : "text-mist-dim hover:text-mist"
            }`}
          >
            {label}
            {tab === key && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gold-500" />
            )}
          </button>
        ))}
      </div>

      {tab === "all" ? (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-72">
              <Search
                size={15}
                strokeWidth={1.5}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist-faint"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search sets or bonus effects"
                className="input pl-9"
                aria-label="Search artifact sets"
              />
            </div>
            {[5, 4, 3].map((r) => (
              <button
                key={r}
                onClick={() => setRarity(rarity === r ? null : r)}
                className={`chip ${rarity === r ? "chip-active" : ""}`}
                style={
                  rarity === r
                    ? {
                        borderColor: rarityColor(r),
                        color: rarityColor(r),
                        backgroundColor: `${rarityColor(r)}14`,
                      }
                    : undefined
                }
              >
                up to {r}★
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="card mt-6 p-10 text-center text-sm text-mist-dim">
              No sets match that search.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((s) => (
                <div key={s.slug} className="card card-hover p-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-lg"
                      style={{
                        background: `linear-gradient(160deg, ${rarityColor(s.maxRarity)}26, transparent 70%)`,
                      }}
                    >
                      {s.icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.icon} alt="" loading="lazy" className="h-11 w-11" />
                      ) : null}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">{s.name}</div>
                      <div className="stat-num mt-0.5 text-xs" style={{ color: rarityColor(s.maxRarity) }}>
                        {s.rarities.map((r) => `${r}★`).join(" / ")}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2 text-[13px] leading-relaxed">
                    {s.bonus1 && (
                      <p className="text-mist-dim">
                        <span className="mr-1.5 font-semibold text-gold-300">1pc</span>
                        {s.bonus1}
                      </p>
                    )}
                    {s.bonus2 && (
                      <p className="text-mist-dim">
                        <span className="mr-1.5 font-semibold text-gold-300">2pc</span>
                        {s.bonus2}
                      </p>
                    )}
                    {s.bonus4 && (
                      <p className="text-mist-dim">
                        <span className="mr-1.5 font-semibold text-gold-300">4pc</span>
                        {s.bonus4}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <MyArtifacts artifacts={hydrated ? myArtifacts : []} hydrated={hydrated} />
      )}
    </div>
  );
}

function MyArtifacts({ artifacts, hydrated }: { artifacts: any[]; hydrated: boolean }) {
  const [setName, setSetName] = useState("");
  const sets = useMemo(
    () => Array.from(new Set(artifacts.map((a) => a?.set).filter(Boolean) as string[])).sort(),
    [artifacts]
  );
  const shown = useMemo(
    () => artifacts.filter((a) => !setName || a?.set === setName),
    [artifacts, setName]
  );

  if (!hydrated) return <div className="skeleton mt-6 h-48 w-full" />;

  if (!artifacts.length) {
    return (
      <div className="card mt-6 p-10 text-center text-sm text-mist-dim">
        No imported artifacts yet. Import your account on the{" "}
        <a href="/connect" className="text-gold-300 underline-offset-2 hover:underline">
          Import Data
        </a>{" "}
        page to see your pieces scored here.
      </div>
    );
  }

  return (
    <div className="mt-6">
      <select
        value={setName}
        onChange={(e) => setSetName(e.target.value)}
        className="input w-auto"
        aria-label="Filter by set"
      >
        <option value="">All sets ({artifacts.length})</option>
        {sets.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((a, i) => {
          const subs = (Array.isArray(a?.substats) ? a.substats : []).map((s: any) => ({
            stat: s?.stat ?? "",
            value: Number(s?.value ?? 0),
          }));
          const rv = critRV(subs);
          const score = scoreArtifact(subs);
          return (
            <div key={`${a?.id || i}-${a?.slot}`} className="card p-4">
              <div className="flex items-center gap-3">
                {a?.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.icon} alt="" loading="lazy" className="h-11 w-11" />
                ) : (
                  <div className="h-11 w-11 rounded-lg bg-ink-800" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">
                    {a?.set || "Unknown set"}
                  </div>
                  <div className="text-xs text-mist-faint">
                    {a?.slot ?? ""} · +{a?.level ?? 0}
                    {a?.holder ? ` · on ${a.holder}` : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="stat-num text-sm font-semibold text-gold-300">
                    {score.toFixed(1)}
                  </div>
                  <div className="stat-num text-[10px] text-mist-faint">RV {rv.toFixed(1)}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-mist-dim">{a?.mainstat?.stat ?? ""}</span>
                <span className="stat-num text-mist">
                  {a?.mainstat?.value != null
                    ? Number(a.mainstat.value) < 2
                      ? `${(Number(a.mainstat.value) * 100).toFixed(1)}%`
                      : Number(a.mainstat.value).toLocaleString()
                    : ""}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-1">
                {subs.map((s: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-[11px]">
                    <span className="text-mist-faint">{s.stat}</span>
                    <span className="stat-num text-mist-dim">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
