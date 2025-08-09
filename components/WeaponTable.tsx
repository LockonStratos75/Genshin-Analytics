"use client";

import { useMemo, useState } from "react";
import useStore from "@/lib/store";

type W = {
  id?: string;
  name?: string;
  nameHash?: number;
  type?: string | null;
  rarity?: number | null;
  level?: number | null;
  refinement?: number | null;
  icon?: string | null;
};

export default function WeaponTable() {
  const characters = useStore((s) => s.characters);
  const weaponsTop = useStore((s) => s.weapons);
  const [sort, setSort] = useState<"rarity" | "refinement" | "level">("rarity");

  // Build weapons list from top-level API if available; otherwise from characters
  const weapons: W[] = useMemo(() => {
    const fromTop = (weaponsTop || []).filter(Boolean) as W[];
    if (fromTop.length) return fromTop;

    const map = new Map<string, W>();
    for (const ch of characters || []) {
      const w: W | undefined = ch?.weapon;
      if (!w) continue;
      const key = `${w.id || ""}|${w.name || ""}|${w.level || ""}|${w.refinement || ""}`;
      if (!map.has(key)) map.set(key, w);
    }
    return Array.from(map.values());
  }, [weaponsTop, characters]);

  const sorted = useMemo(() => {
    const arr = [...weapons];
    arr.sort((a: any, b: any) => (b?.[sort] ?? 0) - (a?.[sort] ?? 0));
    return arr;
  }, [weapons, sort]);

  return (
      <div className="card p-4">
        <div className="flex items-center gap-3 mb-3">
          <label className="subtle">Sort by</label>
          <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/10 bg-transparent"
          >
            <option value="rarity">Rarity</option>
            <option value="refinement">Refinement</option>
            <option value="level">Level</option>
          </select>
          <span className="subtle ml-auto">{sorted.length} items</span>
        </div>

        {sorted.length === 0 ? (
            <p className="subtle">Fetch via Enka to populate weapons.</p>
        ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-left subtle">
                <tr>
                  <th className="py-2 pr-4">Name</th>
                  <th className="pr-4">Rarity</th>
                  <th className="pr-4">Type</th>
                  <th className="pr-4">Refine</th>
                  <th>Level</th>
                </tr>
                </thead>
                <tbody>
                {sorted.map((w, i) => (
                    <tr key={`${w.id || i}-${w.name}`} className="border-t border-black/5 dark:border-white/5">
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          {w.icon ? (
                              <img src={w.icon} alt="" className="w-6 h-6 rounded ring-1 ring-black/10 dark:ring-white/10" />
                          ) : (
                              <div className="w-6 h-6 rounded bg-black/10 dark:bg-white/10" />
                          )}
                          <span className="truncate">{w.name || w.id || "—"}</span>
                        </div>
                      </td>
                      <td className="pr-4">{w.rarity ?? "—"}★</td>
                      <td className="pr-4">{w.type ?? "—"}</td>
                      <td className="pr-4">{w.refinement ?? 1}</td>
                      <td>{w.level ?? "—"}</td>
                    </tr>
                ))}
                </tbody>
              </table>
            </div>
        )}
      </div>
  );
}
