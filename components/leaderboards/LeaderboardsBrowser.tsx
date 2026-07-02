"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Search, Trophy } from "lucide-react";
import type { CharacterSummary } from "@/lib/gamedata";
import { elementColor, formatNum } from "@/lib/display";
import CharacterLeaderboards from "@/components/characters/CharacterLeaderboards";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function LeaderboardsBrowser({ characters }: { characters: CharacterSummary[] }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<CharacterSummary | null>(null);

  // Default: first character with a saved UID's top entry? Keep simple: preselect a popular pick.
  useEffect(() => {
    if (!selected && characters.length) {
      setSelected(characters.find((c) => c.slug === "furina") ?? characters[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characters]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return characters;
    return characters.filter((c) => c.name.toLowerCase().includes(needle));
  }, [characters, q]);

  return (
    <div className="mt-6 space-y-6">
      {/* My rankings */}
      <MyRankings />

      {/* Character picker */}
      <div className="card p-4">
        <div className="relative w-full sm:w-72">
          <Search
            size={15}
            strokeWidth={1.5}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist-faint"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a character"
            className="input pl-9"
            aria-label="Search a character"
          />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {filtered.map((c) => {
            const active = selected?.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`group flex w-16 shrink-0 flex-col items-center gap-1.5 rounded-lg p-1.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold-500/40 ${
                  active ? "bg-gold-500/10" : "hover:bg-ink-800"
                }`}
                title={c.name}
              >
                <span
                  className={`block h-12 w-12 overflow-hidden rounded-full border-2 transition-colors ${
                    active ? "border-gold-500" : "border-white/10 group-hover:border-white/25"
                  }`}
                >
                  {c.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.icon} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
                  ) : null}
                </span>
                <span
                  className={`w-full truncate text-center text-[10px] leading-tight ${
                    active ? "text-gold-300" : "text-mist-faint"
                  }`}
                >
                  {c.name}
                </span>
              </button>
            );
          })}
          {!filtered.length && (
            <div className="py-4 text-sm text-mist-dim">No character matches that search.</div>
          )}
        </div>
      </div>

      {/* Leaderboard for selected */}
      {selected && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{
                backgroundColor: `${elementColor(selected.element)}1f`,
                color: elementColor(selected.element),
              }}
            >
              {selected.element}
            </span>
            <h2 className="text-lg font-semibold text-white">{selected.name}</h2>
          </div>
          <CharacterLeaderboards
            characterId={selected.id}
            accent={elementColor(selected.element)}
          />
        </div>
      )}
    </div>
  );
}

function MyRankings() {
  const [uid, setUid] = useState("");
  const [queryUid, setQueryUid] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("uid");
      if (saved) setUid(saved);
    } catch {}
  }, []);

  const { data, isLoading } = useSWR(
    open && queryUid ? `/api/akasha/${encodeURIComponent(queryUid)}` : null,
    fetcher
  );

  const rows: any[] = (data?.calculations ?? []).filter((r: any) => r.topPercent != null);

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <Trophy size={16} strokeWidth={1.5} className="text-gold-400" />
          Where do my builds rank?
        </div>
        <form
          className="flex flex-1 min-w-[240px] max-w-md items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (uid.trim()) {
              setQueryUid(uid.trim());
              setOpen(true);
            }
          }}
        >
          <input
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            placeholder="Enter your UID"
            inputMode="numeric"
            className="input"
            aria-label="Your UID"
          />
          <button type="submit" className="btn-primary shrink-0">
            Check
          </button>
        </form>
      </div>

      {open && (
        <div className="mt-4">
          {isLoading ? (
            <div className="skeleton h-24 w-full" />
          ) : data?.error ? (
            <p className="text-sm text-mist-dim">
              Could not reach Akasha for that UID right now. Try again shortly.
            </p>
          ) : !rows.length ? (
            <p className="text-sm text-mist-dim">
              No ranked builds found for UID {queryUid}. Make sure your characters are on
              akasha.cv (visit your profile there once to index them).
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="card card-hover flex items-center gap-3 p-3"
                >
                  {r.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.icon} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-ink-800" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white">{r.character}</div>
                    <div className="truncate text-[11px] text-mist-faint">{r.calcName}</div>
                  </div>
                  <div className="text-right">
                    <div className="stat-num text-sm font-semibold text-gold-300">
                      top {Number(r.topPercent).toFixed(1)}%
                    </div>
                    <div className="stat-num text-[11px] text-mist-faint">
                      #{formatNum(r.rank)} / {formatNum(r.outOf)}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
