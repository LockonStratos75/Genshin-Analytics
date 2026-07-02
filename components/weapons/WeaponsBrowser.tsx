"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import useStore from "@/lib/store";
import type { WeaponSummary } from "@/lib/gamedata";
import { rarityColor } from "@/lib/display";

const WEAPON_TYPES = ["Sword", "Claymore", "Polearm", "Bow", "Catalyst"];
type SortKey = "rarity" | "baseAtk" | "name";

export default function WeaponsBrowser({ weapons }: { weapons: WeaponSummary[] }) {
  const [tab, setTab] = useState<"all" | "mine">("all");
  const myCharacters = useStore((s) => s.characters);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const myWeapons = useMemo(() => {
    const map = new Map<string, any>();
    for (const ch of myCharacters || []) {
      const w = ch?.weapon;
      if (!w) continue;
      const key = `${w.name || w.id}|${w.level}|${w.refinement}`;
      if (!map.has(key)) map.set(key, { ...w, holder: ch?.name });
    }
    return Array.from(map.values());
  }, [myCharacters]);

  const [q, setQ] = useState("");
  const [type, setType] = useState<string | null>(null);
  const [rarity, setRarity] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>("rarity");
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const arr = weapons.filter(
      (w) =>
        (!needle ||
          w.name.toLowerCase().includes(needle) ||
          w.effectName.toLowerCase().includes(needle)) &&
        (!type || w.type === type) &&
        (!rarity || w.rarity === rarity)
    );
    arr.sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "baseAtk"
          ? b.baseAtk - a.baseAtk
          : b.rarity - a.rarity || b.baseAtk - a.baseAtk
    );
    return arr;
  }, [weapons, q, type, rarity, sort]);

  return (
    <div className="mt-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.07]">
        {(
          [
            ["all", `Database (${weapons.length})`],
            ["mine", `My Weapons (${hydrated ? myWeapons.length : 0})`],
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
          {/* Filters */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search
                size={15}
                strokeWidth={1.5}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist-faint"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search weapons or passives"
                className="input pl-9"
                aria-label="Search weapons"
              />
            </div>
            {WEAPON_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(type === t ? null : t)}
                className={`chip ${type === t ? "chip-active" : ""}`}
              >
                {t}
              </button>
            ))}
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
                {r}★
              </button>
            ))}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="input ml-auto w-auto"
              aria-label="Sort weapons"
            >
              <option value="rarity">Sort: Rarity</option>
              <option value="baseAtk">Sort: Base ATK</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>

          {/* List */}
          <div className="card mt-5 overflow-hidden">
            <div className="hidden grid-cols-[56px_1.4fr_100px_90px_1fr_32px] items-center gap-3 border-b border-white/[0.07] px-4 py-2 md:grid">
              <span className="th !p-0" />
              <span className="th !p-0">Weapon</span>
              <span className="th !p-0 text-right">Base ATK</span>
              <span className="th !p-0 text-right">Substat</span>
              <span className="th !p-0">Passive</span>
              <span />
            </div>
            {filtered.length === 0 ? (
              <div className="p-10 text-center text-sm text-mist-dim">
                No weapons match those filters.
              </div>
            ) : (
              filtered.map((w) => {
                const open = openSlug === w.slug;
                return (
                  <div key={w.slug} className="border-b border-white/[0.04] last:border-0">
                    <button
                      onClick={() => setOpenSlug(open ? null : w.slug)}
                      className="grid w-full grid-cols-[56px_1fr_32px] items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-ink-850 md:grid-cols-[56px_1.4fr_100px_90px_1fr_32px]"
                      aria-expanded={open}
                    >
                      <span
                        className="grid h-11 w-11 place-items-center rounded-lg"
                        style={{ background: `linear-gradient(160deg, ${rarityColor(w.rarity)}26, transparent 70%)` }}
                      >
                        {w.icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={w.icon} alt="" loading="lazy" className="h-10 w-10" />
                        ) : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-white">
                          {w.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-mist-faint">
                          {w.type} ·{" "}
                          <span className="stat-num" style={{ color: rarityColor(w.rarity) }}>
                            {"★".repeat(w.rarity)}
                          </span>
                        </span>
                      </span>
                      <span className="stat-num hidden text-right text-sm text-mist md:block">
                        {w.baseAtk}
                      </span>
                      <span className="stat-num hidden text-right text-xs text-mist-dim md:block">
                        {w.substatValue}
                        <span className="mt-0.5 block text-[10px] text-mist-faint">{w.substat}</span>
                      </span>
                      <span className="hidden truncate text-xs text-mist-dim md:block">
                        {w.effectName}
                      </span>
                      <ChevronDown
                        size={15}
                        strokeWidth={1.5}
                        className={`text-mist-faint transition-transform ${open ? "rotate-180" : ""}`}
                      />
                    </button>
                    {open && (
                      <div className="bg-ink-950/50 px-4 pb-4 pt-1 md:pl-[84px]">
                        <div className="text-xs font-medium text-gold-300">{w.effectName}</div>
                        <p className="mt-1 max-w-[80ch] text-[13px] leading-relaxed text-mist-dim">
                          {w.effect || "No passive effect."}
                        </p>
                        <div className="stat-num mt-2 text-xs text-mist-faint md:hidden">
                          Base ATK {w.baseAtk} · {w.substat} {w.substatValue}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <MyWeapons weapons={hydrated ? myWeapons : []} hydrated={hydrated} />
      )}
    </div>
  );
}

function MyWeapons({ weapons, hydrated }: { weapons: any[]; hydrated: boolean }) {
  if (!hydrated) return <div className="skeleton mt-6 h-48 w-full" />;
  if (!weapons.length) {
    return (
      <div className="card mt-6 p-10 text-center text-sm text-mist-dim">
        No imported weapons yet. Import your account on the{" "}
        <a href="/connect" className="text-gold-300 underline-offset-2 hover:underline">
          Import Data
        </a>{" "}
        page and your characters&apos; weapons will show up here.
      </div>
    );
  }
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {weapons.map((w, i) => (
        <div key={i} className="card flex items-center gap-3 p-3.5">
          {w.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={w.icon} alt="" className="h-12 w-12" />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-ink-800" />
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-white">{w.name ?? w.id}</div>
            <div className="stat-num mt-0.5 text-xs text-mist-dim">
              Lv {w.level ?? "-"} · R{w.refinement ?? 1}
              {w.rarity ? (
                <span className="ml-1.5" style={{ color: rarityColor(Number(w.rarity)) }}>
                  {"★".repeat(Number(w.rarity) || 0)}
                </span>
              ) : null}
            </div>
            {w.holder && <div className="mt-0.5 text-[11px] text-mist-faint">On {w.holder}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
