"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Trophy,
  Swords,
  Gem,
  BookOpen,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import useStore from "@/lib/store";
import { computeAllStats } from "@/lib/wishStats";
import { elementColor, formatNum } from "@/lib/display";

const SECTIONS = [
  {
    href: "/characters",
    icon: Users,
    title: "Characters",
    desc: "Full character database with talents, constellations, and your imported roster.",
  },
  {
    href: "/leaderboards",
    icon: Trophy,
    title: "Leaderboards",
    desc: "Global Akasha damage rankings. See where your builds land.",
  },
  {
    href: "/weapons",
    icon: Swords,
    title: "Weapons",
    desc: "Every weapon with max stats, substats, and refinement passives.",
  },
  {
    href: "/artifacts",
    icon: Gem,
    title: "Artifacts",
    desc: "All set bonuses, plus roll-value scores for your own pieces.",
  },
  {
    href: "/workshop",
    icon: BookOpen,
    title: "Build Guides",
    desc: "Best weapons, artifacts, stat targets, and teams per character.",
  },
  {
    href: "/gacha",
    icon: Sparkles,
    title: "Wish Tracker",
    desc: "Pity counters, 50/50 record, and full pull history.",
  },
];

export default function DashboardPage() {
  const characters = useStore((s) => s.characters);
  const wishes = useStore((s) => s.wishes);
  const [hydrated, setHydrated] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
    try {
      setUid(localStorage.getItem("uid"));
    } catch {}
  }, []);

  const wishStats = useMemo(() => computeAllStats(hydrated ? wishes : []), [wishes, hydrated]);
  const hasRoster = hydrated && (characters?.length ?? 0) > 0;
  const hasWishes = hydrated && wishStats.total > 0;
  const hasAnything = hasRoster || hasWishes;

  return (
    <div>
      {/* Hero */}
      <div className="card relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(700px_300px_at_80%_-20%,rgba(223,169,74,0.12),transparent_65%)]" />
        <div className="relative p-6 md:p-10">
          <h1 className="max-w-[24ch] text-3xl font-semibold leading-tight tracking-tight text-white md:text-4xl">
            Your Genshin account, quantified.
          </h1>
          <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-mist-dim md:text-base">
            Builds, leaderboards, and pity tracking in one place. Import once with your UID; the
            data never leaves your browser.
          </p>
          {!hasAnything && hydrated && (
            <Link href="/connect" className="btn-primary mt-6">
              Import my account
              <ArrowRight size={15} strokeWidth={1.5} />
            </Link>
          )}
        </div>
      </div>

      {/* Account snapshot */}
      {hasAnything && (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {/* Roster summary */}
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-mist-dim">Roster</span>
              {uid && <span className="stat-num text-xs text-mist-faint">UID {uid}</span>}
            </div>
            {hasRoster ? (
              <>
                <div className="mt-3 flex -space-x-2">
                  {characters.slice(0, 8).map((c: any, i: number) =>
                    c?.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={c.icon}
                        alt={c.name ?? ""}
                        title={c.name}
                        className="h-10 w-10 rounded-full border-2 border-ink-900 object-cover"
                        style={{ backgroundColor: `${elementColor(c.element)}33` }}
                      />
                    ) : null
                  )}
                </div>
                <div className="mt-3 text-sm text-mist-dim">
                  <span className="stat-num font-semibold text-white">{characters.length}</span>{" "}
                  showcase characters imported
                </div>
                <Link
                  href="/characters"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-gold-300 hover:underline"
                >
                  View roster <ArrowRight size={12} strokeWidth={1.5} />
                </Link>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm text-mist-dim">No characters imported yet.</p>
                <Link
                  href="/connect"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-gold-300 hover:underline"
                >
                  Import from Enka <ArrowRight size={12} strokeWidth={1.5} />
                </Link>
              </>
            )}
          </div>

          {/* Pity summary */}
          <div className="card p-5">
            <span className="text-sm font-medium text-mist-dim">Pity</span>
            {hasWishes ? (
              <>
                <div className="mt-3 space-y-2.5">
                  {(
                    [
                      ["Character", wishStats.character, "#e8bc66"],
                      ["Weapon", wishStats.weapon, "#b48fff"],
                      ["Standard", wishStats.standard, "#54c8f0"],
                    ] as const
                  ).map(([label, s, color]) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="w-20 text-xs text-mist-faint">{label}</span>
                      <div className="h-1.5 flex-1 rounded-full bg-ink-800">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (s.currentPity / s.hardPity) * 100)}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                      <span className="stat-num w-14 text-right text-xs text-mist">
                        {s.currentPity}/{s.hardPity}
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/gacha"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-gold-300 hover:underline"
                >
                  Open wish tracker <ArrowRight size={12} strokeWidth={1.5} />
                </Link>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm text-mist-dim">No wish history imported yet.</p>
                <Link
                  href="/gacha"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-gold-300 hover:underline"
                >
                  Import wishes <ArrowRight size={12} strokeWidth={1.5} />
                </Link>
              </>
            )}
          </div>

          {/* Wish totals */}
          <div className="card p-5">
            <span className="text-sm font-medium text-mist-dim">Lifetime pulls</span>
            {hasWishes ? (
              <>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <div className="stat-num text-2xl font-semibold text-white">
                      {formatNum(wishStats.total)}
                    </div>
                    <div className="text-[11px] text-mist-faint">wishes</div>
                  </div>
                  <div>
                    <div className="stat-num text-2xl font-semibold" style={{ color: "#ffb547" }}>
                      {wishStats.allFive.length}
                    </div>
                    <div className="text-[11px] text-mist-faint">5★ pulls</div>
                  </div>
                </div>
                {wishStats.allFive[0] && (
                  <div className="mt-3 text-xs text-mist-dim">
                    Latest 5★:{" "}
                    <span className="font-medium text-gold-300">{wishStats.allFive[0].name}</span>{" "}
                    at pity{" "}
                    <span className="stat-num text-white">{wishStats.allFive[0].pity}</span>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-3 text-sm text-mist-dim">
                Import your wish history to see totals and your 50/50 record.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="card card-hover group p-5 outline-none focus-visible:ring-2 focus-visible:ring-gold-500/40"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg border border-gold-500/25 bg-gold-500/10">
                  <Icon size={16} strokeWidth={1.5} className="text-gold-400" />
                </span>
                <span className="text-base font-semibold text-white">{s.title}</span>
                <ArrowRight
                  size={15}
                  strokeWidth={1.5}
                  className="ml-auto text-mist-faint opacity-0 transition-opacity group-hover:opacity-100"
                />
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-mist-dim">{s.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
