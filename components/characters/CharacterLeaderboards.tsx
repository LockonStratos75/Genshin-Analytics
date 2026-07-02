"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { ExternalLink } from "lucide-react";
import { formatNum } from "@/lib/display";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

type Props = {
  characterId: number;
  accent?: string;
};

export default function CharacterLeaderboards({ characterId, accent = "#dfa94a" }: Props) {
  const { data: catData, error: catError } = useSWR(
    `/api/akasha/categories?characterId=${characterId}`,
    fetcher
  );

  const categories: any[] = catData?.categories ?? [];
  const [catIdx, setCatIdx] = useState(0);
  const [weaponIdx, setWeaponIdx] = useState(0);
  useEffect(() => {
    setCatIdx(0);
    setWeaponIdx(0);
  }, [characterId]);

  const category = categories[catIdx];
  const weapon = category?.weapons?.[weaponIdx];
  const calcId = weapon?.calculationId;
  const variant = weapon?.defaultVariant || undefined;

  const { data: lbData, isLoading: lbLoading } = useSWR(
    calcId
      ? `/api/akasha/leaderboard/${calcId}?size=20${variant ? `&variant=${encodeURIComponent(variant)}` : ""}`
      : null,
    fetcher
  );

  const rows: any[] = lbData?.rows ?? [];

  const shortDetails = useMemo(() => {
    const d = category?.details || "";
    return d.length > 220 ? d.slice(0, 220) + "…" : d;
  }, [category]);

  if (catError || catData?.error) {
    return (
      <div className="card p-6 text-sm text-mist-dim">
        Leaderboards are unavailable right now (Akasha System could not be reached). Try again in a
        minute.
      </div>
    );
  }

  if (!catData) {
    return <div className="skeleton h-64 w-full" />;
  }

  if (!categories.length) {
    return (
      <div className="card p-6 text-sm text-mist-dim">
        No Akasha leaderboards exist for this character yet.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-white/[0.07] p-3">
        {categories.map((cat, i) => (
          <button
            key={cat._id ?? i}
            onClick={() => {
              setCatIdx(i);
              setWeaponIdx(0);
            }}
            className={`chip ${i === catIdx ? "chip-active" : ""}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Weapon variants */}
      {category?.weapons?.length > 1 && (
        <div className="flex flex-wrap gap-1.5 border-b border-white/[0.07] p-3">
          {category.weapons.map((w: any, i: number) => (
            <button
              key={w.calculationId ?? i}
              onClick={() => setWeaponIdx(i)}
              className={`chip ${i === weaponIdx ? "chip-active" : ""}`}
              title={w.name}
            >
              {w.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={w.icon} alt="" className="h-4 w-4" />
              ) : null}
              {w.name}
            </button>
          ))}
        </div>
      )}

      {shortDetails && (
        <p className="border-b border-white/[0.07] px-4 py-3 text-xs leading-relaxed text-mist-faint">
          {shortDetails}
        </p>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-white/[0.07]">
            <tr>
              <th className="th w-12">#</th>
              <th className="th">Player</th>
              <th className="th">Constellation</th>
              <th className="th">Crit value</th>
              <th className="th">Artifacts</th>
              <th className="th text-right">Result</th>
            </tr>
          </thead>
          <tbody>
            {lbLoading && !rows.length
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    <td colSpan={6} className="td">
                      <div className="skeleton h-6 w-full" />
                    </td>
                  </tr>
                ))
              : rows.map((r, i) => {
                  const sets = Object.entries(r.artifactSets ?? {}) as [string, any][];
                  return (
                    <tr
                      key={r._id ?? i}
                      className="border-b border-white/[0.04] transition-colors hover:bg-ink-850"
                    >
                      <td className="td stat-num text-mist-faint">{i + 1}</td>
                      <td className="td">
                        <a
                          href={`https://akasha.cv/profile/${r.uid}`}
                          target="_blank"
                          rel="noreferrer"
                          className="group inline-flex items-center gap-1.5 font-medium text-white hover:text-gold-300"
                        >
                          {r.owner?.nickname ?? r.uid}
                          <ExternalLink
                            size={12}
                            strokeWidth={1.5}
                            className="opacity-0 transition-opacity group-hover:opacity-60"
                          />
                        </a>
                        <span className="ml-2 stat-num text-xs text-mist-faint">{r.uid}</span>
                      </td>
                      <td className="td stat-num text-mist-dim">C{r.constellation ?? 0}</td>
                      <td className="td stat-num text-mist-dim">
                        {r.critValue != null ? Number(r.critValue).toFixed(1) : "-"}
                      </td>
                      <td className="td">
                        <div className="flex items-center gap-1">
                          {sets.slice(0, 2).map(([name, s]) =>
                            s?.icon ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={name}
                                src={s.icon}
                                alt={name}
                                title={`${s.count}pc ${name}`}
                                className="h-6 w-6"
                              />
                            ) : (
                              <span key={name} className="text-xs text-mist-faint">
                                {s.count}pc {name}
                              </span>
                            )
                          )}
                        </div>
                      </td>
                      <td className="td stat-num text-right font-medium" style={{ color: accent }}>
                        {formatNum(r.calculation?.result)}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
      {!lbLoading && !rows.length ? (
        <div className="p-6 text-center text-sm text-mist-dim">No entries for this variant.</div>
      ) : null}
    </div>
  );
}
