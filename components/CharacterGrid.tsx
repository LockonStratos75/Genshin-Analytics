"use client";

import { useMemo, useState } from "react";
import useStore from "@/lib/store";

const elementLabel = (e?: string) => {
  if (!e) return "—";
  const map: Record<string, string> = {
    Fire: "Pyro",
    Water: "Hydro",
    Ice: "Cryo",
    Electric: "Electro",
    Wind: "Anemo",
    Rock: "Geo",
    Grass: "Dendro",
    Pyro: "Pyro",
    Hydro: "Hydro",
    Cryo: "Cryo",
    Electro: "Electro",
    Anemo: "Anemo",
    Geo: "Geo",
    Dendro: "Dendro",
  };
  return map[e] ?? e;
};

function safeName(v: any, fallback: string | number) {
  // Some payloads arrive with the literal string "undefined"
  if (v === undefined || v === null || v === "" || v === "undefined") return String(fallback);
  return String(v);
}

export default function CharacterGrid() {
  const chars = useStore((s) => s.characters);
  const [q, setQ] = useState("");
  const [element, setElement] = useState("");

  const filtered = useMemo(() => {
    return (chars || []).filter((c: any) => {
      const name = safeName(c?.name, c?.id);
      const el = elementLabel(c?.element);
      return (!q || name.toLowerCase().includes(q.toLowerCase())) && (!element || el === element);
    });
  }, [chars, q, element]);

  if (!chars || chars.length === 0) {
    return <p className="opacity-70">Fetch via Enka to see your characters.</p>;
  }

  return (
      <div className="card p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name…"
              className="px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/10 bg-transparent"
          />
          <select
              value={element}
              onChange={(e) => setElement(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/10 bg-transparent"
          >
            <option value="">All elements</option>
            <option>Pyro</option>
            <option>Hydro</option>
            <option>Anemo</option>
            <option>Electro</option>
            <option>Dendro</option>
            <option>Cryo</option>
            <option>Geo</option>
          </select>
          <span className="subtle ml-auto">{filtered.length} shown</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((c: any, i: number) => {
            const name = safeName(c?.name, c?.id ?? i);
            const el = elementLabel(c?.element);
            const cons = c?.constellations ?? 0;

            const weapon = c?.weapon;
            const wName = safeName(weapon?.name ?? weapon?.id, "—");
            const wIcon = weapon?.icon ?? null;
            const wRef = weapon?.refinement ?? 1;
            const wLv = weapon?.level ?? 1;

            const arts: any[] = Array.isArray(c?.artifacts) ? c.artifacts : [];
            // Keep order consistent by slot
            const slotOrder = ["Flower", "Feather", "Sands", "Goblet", "Circlet"];
            const sortedArts = [...arts].sort(
                (a, b) => slotOrder.indexOf(a?.slot) - slotOrder.indexOf(b?.slot)
            );

            return (
                <div
                    key={c?.id ?? i}
                    className="rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-white/70 dark:bg-white/5 backdrop-blur-sm hover:shadow-lg transition-shadow"
                >
                  {/* header: icon + name/row */}
                  <div className="flex items-center gap-4">
                    {c?.icon ? (
                        <img
                            src={c.icon}
                            alt={name}
                            className="w-16 h-16 rounded-2xl object-cover ring-1 ring-black/10 dark:ring-white/10"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-2xl bg-black/10 dark:bg-white/10" />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="text-base font-semibold truncate">{name}</div>
                      <div className="text-xs opacity-75">
                        Lv {c?.level ?? "—"} • {el} • C{cons}
                      </div>

                      {/* weapon row */}
                      <div className="mt-2 flex items-center gap-2 text-xs opacity-90">
                        {wIcon ? (
                            <img
                                src={wIcon}
                                alt={wName}
                                className="w-5 h-5 rounded-md object-cover ring-1 ring-black/10 dark:ring-white/10"
                            />
                        ) : (
                            <div className="w-5 h-5 rounded-md bg-black/10 dark:bg-white/10" />
                        )}
                        <div className="truncate">
                          <span className="opacity-80">Weapon:</span>{" "}
                          <span className="font-medium">{wName}</span>{" "}
                          <span className="opacity-70">R{wRef} • Lv {wLv}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* artifacts row */}
                  <div className="mt-3">
                    <div className="text-xs opacity-70 mb-1">Artifacts</div>
                    <div className="flex items-center gap-2">
                      {slotOrder.map((slot) => {
                        const a = sortedArts.find((x) => x?.slot === slot);
                        const icon = a?.icon ?? null;
                        const title = a
                            ? `${a.set ?? "Set"} • +${a.level ?? 0}${a.mainstat?.stat ? " • " + a.mainstat.stat : ""}`
                            : `${slot} — empty`;

                        return icon ? (
                            <img
                                key={slot}
                                src={icon}
                                title={title}
                                className="w-8 h-8 rounded-lg object-cover ring-1 ring-black/10 dark:ring-white/10"
                                alt={slot}
                            />
                        ) : (
                            <div
                                key={slot}
                                title={title}
                                className="w-8 h-8 rounded-lg bg-black/10 dark:bg-white/10 grid place-items-center text-[10px] opacity-60"
                            >
                              {slot[0]}
                            </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
            );
          })}
        </div>
      </div>
  );
}
