"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import useStore from "@/lib/store";
import type { CharacterSummary } from "@/lib/gamedata";
import { elementColor, rarityColor, ELEMENT_COLORS } from "@/lib/display";

const WEAPON_TYPES = ["Sword", "Claymore", "Polearm", "Bow", "Catalyst"];
const ELEMENTS = Object.keys(ELEMENT_COLORS);

export default function CharacterBrowser({ characters }: { characters: CharacterSummary[] }) {
  const [tab, setTab] = useState<"all" | "roster">("all");
  const roster = useStore((s) => s.characters);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const [q, setQ] = useState("");
  const [element, setElement] = useState<string | null>(null);
  const [weapon, setWeapon] = useState<string | null>(null);
  const [rarity, setRarity] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return characters.filter(
      (c) =>
        (!needle || c.name.toLowerCase().includes(needle)) &&
        (!element || c.element === element) &&
        (!weapon || c.weaponType === weapon) &&
        (!rarity || c.rarity === rarity)
    );
  }, [characters, q, element, weapon, rarity]);

  const rosterCount = hydrated ? roster?.length ?? 0 : 0;

  return (
    <div className="mt-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.07]">
        {(
          [
            ["all", `Database (${characters.length})`],
            ["roster", `My Roster (${rosterCount})`],
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
                placeholder="Search characters"
                className="input pl-9"
                aria-label="Search characters"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ELEMENTS.map((el) => (
                <button
                  key={el}
                  onClick={() => setElement(element === el ? null : el)}
                  className={`chip ${element === el ? "chip-active" : ""}`}
                  style={element === el ? { borderColor: elementColor(el), color: elementColor(el), backgroundColor: `${elementColor(el)}14` } : undefined}
                >
                  {el}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {WEAPON_TYPES.map((w) => (
                <button
                  key={w}
                  onClick={() => setWeapon(weapon === w ? null : w)}
                  className={`chip ${weapon === w ? "chip-active" : ""}`}
                >
                  {w}
                </button>
              ))}
              {[5, 4].map((r) => (
                <button
                  key={r}
                  onClick={() => setRarity(rarity === r ? null : r)}
                  className={`chip ${rarity === r ? "chip-active" : ""}`}
                  style={rarity === r ? { borderColor: rarityColor(r), color: rarityColor(r), backgroundColor: `${rarityColor(r)}14` } : undefined}
                >
                  {r}★
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="card mt-6 p-10 text-center text-sm text-mist-dim">
              No characters match those filters.
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filtered.map((c) => (
                <DbCard key={c.id || c.name} c={c} />
              ))}
            </div>
          )}
        </>
      ) : (
        <RosterGrid roster={hydrated ? roster : []} hydrated={hydrated} />
      )}
    </div>
  );
}

function DbCard({ c }: { c: CharacterSummary }) {
  return (
    <Link
      href={`/characters/${c.slug}`}
      className="card card-hover group overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-gold-500/40"
    >
      <div
        className="relative aspect-square w-full"
        style={{
          background: `linear-gradient(160deg, ${rarityColor(c.rarity)}26, transparent 65%)`,
        }}
      >
        {c.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.icon}
            alt={c.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-2xl font-semibold text-mist-faint">
            {c.name[0]}
          </div>
        )}
        <span
          className="absolute right-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ backgroundColor: `${elementColor(c.element)}26`, color: elementColor(c.element) }}
        >
          {c.element}
        </span>
      </div>
      <div className="px-3 py-2.5">
        <div className="truncate text-sm font-medium text-white">{c.name}</div>
        <div className="mt-0.5 flex items-center justify-between text-xs">
          <span className="text-mist-faint">{c.weaponType}</span>
          <span className="stat-num" style={{ color: rarityColor(c.rarity) }}>
            {"★".repeat(c.rarity)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function RosterGrid({ roster, hydrated }: { roster: any[]; hydrated: boolean }) {
  const [uid, setUid] = useState<string>("");
  useEffect(() => {
    try {
      setUid(localStorage.getItem("uid") || sessionStorage.getItem("enka:uid") || "");
    } catch {}
  }, []);

  if (!hydrated) {
    return (
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton aspect-[4/5]" />
        ))}
      </div>
    );
  }

  if (!roster?.length) {
    return (
      <div className="card mt-6 flex flex-col items-center gap-3 p-12 text-center">
        <div className="text-sm text-mist-dim">
          No roster yet. Import your showcase characters from Enka.Network with your UID.
        </div>
        <Link href="/connect" className="btn-primary">
          Import my account
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {roster.map((c: any) => {
        const href = uid && c?.id ? `/characters/${uid}/${c.id}` : "#";
        return (
          <Link
            key={c.id ?? c.name}
            href={href}
            className="card card-hover group overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-gold-500/40"
          >
            <div
              className="relative aspect-square"
              style={{
                background: `linear-gradient(160deg, ${elementColor(c.element)}22, transparent 65%)`,
              }}
            >
              {c.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.icon}
                  alt={c.name ?? "Character"}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-2xl text-mist-faint">
                  {(c.name ?? "?")[0]}
                </div>
              )}
              <span className="absolute right-1.5 top-1.5 rounded-full bg-ink-950/70 px-2 py-0.5 text-[10px] font-semibold text-gold-300">
                C{c.constellations ?? 0}
              </span>
            </div>
            <div className="px-3 py-2.5">
              <div className="truncate text-sm font-medium text-white">{c.name ?? c.id}</div>
              <div className="mt-0.5 flex items-center justify-between text-xs text-mist-faint">
                <span>Lv {c.level ?? "-"}</span>
                <span
                  className="font-medium"
                  style={{ color: elementColor(c.element) }}
                >
                  {c.element ?? ""}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
