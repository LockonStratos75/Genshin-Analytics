"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { elementColor, ELEMENT_COLORS } from "@/lib/display";

type GuideSummary = {
  slug: string;
  name: string;
  element: string;
  weaponType: string;
  roles: string[];
  blurb: string;
};

const ELEMENTS = Object.keys(ELEMENT_COLORS);
const WEAPONS = ["Sword", "Claymore", "Polearm", "Bow", "Catalyst"];

function toWebpFilename(displayName: string) {
  let x = (displayName || "")
    .normalize("NFKD")
    .replace(/[‘’]/g, "'")
    .replace(/[–—-]/g, "_")
    .replace(/\s+/g, "_");
  x = x.replace(/[^A-Za-z0-9_']/g, "_");
  x = x.replace(/_+/g, "_").replace(/^_+|_+$/g, "");
  return `${x}.webp`;
}

export default function GuidesBrowser({ guides }: { guides: GuideSummary[] }) {
  const [q, setQ] = useState("");
  const [element, setElement] = useState<string | null>(null);
  const [weapon, setWeapon] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return guides.filter(
      (g) =>
        (!needle ||
          g.name.toLowerCase().includes(needle) ||
          g.roles.some((r) => r.toLowerCase().includes(needle))) &&
        (!element || g.element === element) &&
        (!weapon || g.weaponType === weapon)
    );
  }, [guides, q, element, weapon]);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search
            size={15}
            strokeWidth={1.5}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist-faint"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search characters or roles"
            className="input pl-9"
            aria-label="Search build guides"
          />
        </div>
        {ELEMENTS.map((el) => (
          <button
            key={el}
            onClick={() => setElement(element === el ? null : el)}
            className={`chip ${element === el ? "chip-active" : ""}`}
            style={
              element === el
                ? {
                    borderColor: elementColor(el),
                    color: elementColor(el),
                    backgroundColor: `${elementColor(el)}14`,
                  }
                : undefined
            }
          >
            {el}
          </button>
        ))}
        {WEAPONS.map((w) => (
          <button
            key={w}
            onClick={() => setWeapon(weapon === w ? null : w)}
            className={`chip ${weapon === w ? "chip-active" : ""}`}
          >
            {w}
          </button>
        ))}
      </div>

      {!filtered.length ? (
        <div className="card mt-6 p-10 text-center text-sm text-mist-dim">
          No guides match those filters.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g) => {
            const el = elementColor(g.element);
            return (
              <Link
                key={g.slug}
                href={`/workshop/${g.slug}`}
                className="card card-hover group relative overflow-hidden p-4 outline-none focus-visible:ring-2 focus-visible:ring-gold-500/40"
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-70"
                  style={{
                    background: `radial-gradient(220px 120px at 100% 0%, ${el}14, transparent 70%)`,
                  }}
                />
                <div className="relative flex items-start gap-3.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/character_imgs/${encodeURIComponent(toWebpFilename(g.name))}`}
                    alt={g.name}
                    loading="lazy"
                    className="h-16 w-16 rounded-lg border border-white/10 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-semibold text-white">{g.name}</div>
                    <div className="mt-0.5 text-xs">
                      <span className="font-medium" style={{ color: el }}>
                        {g.element}
                      </span>
                      <span className="text-mist-faint"> · {g.weaponType}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {g.roles.slice(0, 3).map((r) => (
                        <span
                          key={r}
                          className="rounded-full border border-white/10 bg-ink-950/60 px-2 py-0.5 text-[10px] text-mist-dim"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {g.blurb && (
                  <p className="relative mt-3 line-clamp-2 text-[13px] leading-relaxed text-mist-dim">
                    {g.blurb}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
