"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useStore from "@/lib/store";

/* ---------- helpers ---------- */

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
  if (v === undefined || v === null || v === "" || v === "undefined") return String(fallback);
  return String(v);
}

/* ---------- component ---------- */

export default function CharacterGrid() {
  const chars = useStore((s: any) => s.characters);
  const uidFromStore = useStore((s: any) => s.uid || s.lastUid);
  const searchParams = useSearchParams();

  // pull uid from several places so links always resolve
  const [uidStorage, setUidStorage] = useState<{ session?: string; local?: string }>({});
  useEffect(() => {
    if (typeof window !== "undefined") {
      setUidStorage({
        session: window.sessionStorage.getItem("enka:uid") || undefined,
        local: window.localStorage.getItem("uid") || undefined,
      });
    }
  }, []);

  const uid = uidFromStore || searchParams.get("uid") || uidStorage.session || uidStorage.local || "";

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

  const slotOrder = ["Flower", "Feather", "Sands", "Goblet", "Circlet"];

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
            const sortedArts = [...arts].sort(
                (a, b) => slotOrder.indexOf(a?.slot) - slotOrder.indexOf(b?.slot)
            );

            const canLink = Boolean(uid && c?.id);
            const href = canLink ? `/characters/${uid}/${c.id}` : "#";

            const card = (
                <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 bg-white/70 dark:bg-white/5 backdrop-blur-sm hover:shadow-lg transition-shadow">
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
                      <div className="text-xs opacity-75">Lv {c?.level ?? "—"} • {el} • C{cons}</div>

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

                    <span className="text-[10px] px-2 py-1 rounded-lg border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 whitespace-nowrap">
                  {canLink ? "View →" : "No UID"}
                </span>
                  </div>

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

            return canLink ? (
                <Link key={c?.id ?? i} href={href} prefetch={false} className="outline-none rounded-2xl">
                  {card}
                </Link>
            ) : (
                <div key={c?.id ?? i} title="UID not found; add ?uid=XXXXXXXXX to URL or fetch in Connect.">
                  {card}
                </div>
            );
          })}
        </div>
      </div>
  );
}
