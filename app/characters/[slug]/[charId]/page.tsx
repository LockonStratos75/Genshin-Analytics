// Roster build detail: /characters/<uid>/<charId> (slug segment carries the UID)
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import RefreshAkashaButton from "@/components/RefreshAkashaButton";
import { elementColor, slugify } from "@/lib/display";
import { ArrowLeft, BookOpen } from "lucide-react";
import workshopDb from "@/data/workshop-db.json";

/* ---------------- types (loose to avoid build friction) ---------------- */
type Sub = { stat?: string; value?: number; isPercent?: boolean };
type Main = { stat?: string; value?: number; isPercent?: boolean };

type Artifact = {
  id?: string;
  set?: string;
  rarity?: number | null;
  level?: number | null;
  slot?: string;
  mainstat?: Main;
  substats?: Sub[] | { substats?: Sub[] } | any;
  icon?: string | null;
};

type Weapon = {
  id?: string;
  name?: string;
  type?: string | null;
  rarity?: number | null;
  level?: number | null;
  refinement?: number | null;
  icon?: string | null;
};

type TalentEntry = { name?: string | null; level?: number | null };
type Talents = { normal?: TalentEntry; skill?: TalentEntry; burst?: TalentEntry };

type Character = {
  id: string;
  name: string;
  level?: number;
  constellations?: number;
  icon?: string | null;
  weaponType?: string | null;
  rarity?: string | number | null;
  artifacts?: Artifact[];
  weapon?: Weapon | null;
  element?: string | null;
  stats?: Record<string, number>;
  baseStats?: Record<string, number>;
  talents?: Talents;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string; charId: string };
}): Promise<Metadata> {
  return { title: `Build ${params.charId} · Genshin Analytics` };
}

/* ---------------- helpers ---------------- */
function pctStat(stat?: string) {
  if (!stat) return false;
  return /(rate|dmg|bonus|recharge|%)/i.test(stat.toLowerCase());
}
function fmt(stat?: string, value?: number, isPercent?: boolean) {
  if (value == null || Number.isNaN(value)) return "-";
  const asPct = typeof isPercent === "boolean" ? isPercent : pctStat(stat);
  const v = asPct && value > 0 && value < 1 ? value * 100 : value;
  return asPct ? `${v.toFixed(1)}%` : `${Math.round(v).toLocaleString()}`;
}
function normalizeSubstats(a?: Artifact): Sub[] {
  if (!a) return [];
  if (
    Array.isArray((a as any)?.substats) &&
    (a as any).substats.every((x: any) => x && typeof x.stat === "string")
  ) {
    return (a as any).substats as Sub[];
  }
  const raw = Array.isArray((a as any)?.substats?.substats)
    ? (a as any).substats.substats
    : Array.isArray((a as any)?.substats)
      ? (a as any).substats
      : Array.isArray((a as any)?.subStats)
        ? (a as any).subStats
        : Array.isArray((a as any)?.substatList)
          ? (a as any).substatList
          : [];

  return (raw as any[]).map((s: any) => ({
    stat:
      s?.fightPropName?.get?.("en") ||
      s?.statProperty?.name ||
      s?.type ||
      s?.propType ||
      s?.key ||
      s?.stat ||
      "",
    value: Number(s?.value ?? s?.statValue ?? 0),
    isPercent: !!s?.isPercent,
  }));
}
function absoluteApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}${path.startsWith("/") ? path : `/${path}`}`;
}

/* ---------------- page ---------------- */
export default async function CharacterPage({
  params,
}: {
  params: { slug: string; charId: string };
}) {
  const { slug: uid, charId } = params;

  const [enkaRes, akRes] = await Promise.all([
    fetch(absoluteApiUrl(`/api/enka/${encodeURIComponent(uid)}`), {
      next: { revalidate: 300 },
    }),
    fetch(absoluteApiUrl(`/api/akasha/${encodeURIComponent(uid)}`), {
      next: { revalidate: 600 },
    }).catch(() => null),
  ]);

  if (!enkaRes.ok) {
    return (
      <div className="card p-8 text-center">
        <h1 className="text-lg font-semibold text-white">Could not load this profile</h1>
        <p className="page-sub">
          Enka.Network returned {enkaRes.status} {enkaRes.statusText}. The UID may be wrong or the
          service is briefly down.
        </p>
        <Link href="/connect" className="btn-ghost mt-4">
          Check connection
        </Link>
      </div>
    );
  }

  const data = await enkaRes.json();
  const characters: Character[] = Array.isArray(data?.characters) ? data.characters : [];
  const c = characters.find((x) => String(x.id) === String(charId));

  if (!c) {
    return (
      <div className="card p-8 text-center">
        <h1 className="text-lg font-semibold text-white">Character not in showcase</h1>
        <p className="page-sub">
          This character (ID {charId}) is not in the Enka showcase for UID {uid}. Add them to your
          in-game showcase and refresh.
        </p>
      </div>
    );
  }

  let ak: any = null;
  try {
    const akasha = akRes?.ok ? await akRes.json() : null;
    ak =
      akasha?.calculations?.find(
        (x: any) => (x.character || "").toLowerCase() === c.name.toLowerCase()
      ) ?? null;
  } catch {
    ak = null;
  }

  const artifacts = (c.artifacts || []).map((a) => ({ ...a, substats: normalizeSubstats(a) }));
  const el = elementColor(c.element);
  const guide = (workshopDb as any[]).find((g) => g.slug === slugify(c.name));

  const statOrder = [
    "Max HP",
    "ATK",
    "DEF",
    "Elemental Mastery",
    "CRIT Rate",
    "CRIT DMG",
    "Energy Recharge",
    "Physical DMG Bonus",
    "Pyro DMG Bonus",
    "Hydro DMG Bonus",
    "Electro DMG Bonus",
    "Anemo DMG Bonus",
    "Cryo DMG Bonus",
    "Geo DMG Bonus",
    "Dendro DMG Bonus",
    "Healing Bonus",
  ];
  const stats = c.stats || {};
  const shownStats = [
    ...statOrder.filter((k) => k in stats),
    ...Object.keys(stats).filter((k) => !statOrder.includes(k)),
  ];

  return (
    <div>
      <Link
        href="/characters"
        className="inline-flex items-center gap-1.5 text-sm text-mist-dim transition-colors hover:text-mist"
      >
        <ArrowLeft size={15} strokeWidth={1.5} /> Characters
      </Link>

      {/* Header */}
      <div className="card relative mt-4 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(600px 260px at 15% 0%, ${el}1c, transparent 70%)` }}
        />
        <div className="relative flex flex-wrap items-center gap-5 p-6">
          {c.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={c.icon}
              alt={c.name}
              className="h-20 w-20 rounded-xl border border-white/10 object-cover"
            />
          ) : (
            <div className="h-20 w-20 rounded-xl bg-ink-800" />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-white">{c.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-mist-dim">
              <span className="stat-num">Lv {c.level ?? "-"}</span>
              <span className="font-medium" style={{ color: el }}>
                {c.element ?? ""}
              </span>
              <span className="stat-num text-gold-300">C{c.constellations ?? 0}</span>
              <span className="stat-num text-xs text-mist-faint">UID {uid}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {ak ? (
                <a
                  href={ak.url}
                  target="_blank"
                  rel="noreferrer"
                  className="chip chip-active"
                  title={ak.calcName ?? "Akasha leaderboard"}
                >
                  Akasha top {Number(ak.topPercent ?? 0).toFixed(1)}%
                  {ak.rank ? (
                    <span className="stat-num">
                      #{Number(ak.rank).toLocaleString()}
                    </span>
                  ) : null}
                </a>
              ) : (
                <span className="chip cursor-default">No Akasha ranking yet</span>
              )}
              <RefreshAkashaButton uid={uid} />
              {guide && (
                <Link href={`/workshop/${guide.slug}`} className="chip">
                  <BookOpen size={13} strokeWidth={1.5} />
                  Build guide
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left: stats + artifacts */}
        <div className="min-w-0 space-y-6">
          {!!shownStats.length && (
            <section className="card p-5">
              <h2 className="text-base font-semibold text-white">Combat stats</h2>
              <div className="mt-4 grid gap-x-8 gap-y-1 sm:grid-cols-2">
                {shownStats.map((k) => (
                  <div
                    key={k}
                    className="flex items-center justify-between border-b border-white/[0.05] py-2 last:border-0 sm:[&:nth-last-child(2)]:border-0"
                  >
                    <span className="text-[13px] text-mist-dim">{k}</span>
                    <span className="stat-num text-sm font-medium text-white">
                      {fmt(k, stats[k], /(Rate|DMG|Bonus|Recharge)/i.test(k))}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="card p-5">
            <h2 className="text-base font-semibold text-white">Artifacts</h2>
            {!artifacts.length ? (
              <p className="page-sub">No artifacts equipped.</p>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {artifacts.map((a, i) => {
                  const subs = Array.isArray(a.substats) ? (a.substats as Sub[]) : [];
                  return (
                    <div
                      key={`${a.id || i}-${a.slot}-${a.level}`}
                      className="rounded-lg border border-white/[0.07] bg-ink-950/40 p-4"
                    >
                      <div className="flex items-center gap-3">
                        {a.icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.icon} alt="" className="h-11 w-11" />
                        ) : (
                          <div className="h-11 w-11 rounded-lg bg-ink-800" />
                        )}
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-white">
                            {a.set || "Unknown set"}
                          </div>
                          <div className="text-xs text-mist-faint">
                            {a.slot ?? ""} · +{a.level ?? 0}
                          </div>
                        </div>
                        <div className="ml-auto text-right">
                          <div className="text-[11px] text-mist-faint">{a.mainstat?.stat}</div>
                          <div className="stat-num text-base font-semibold text-gold-300">
                            {fmt(a.mainstat?.stat, a.mainstat?.value, a.mainstat?.isPercent)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5">
                        {subs.map((s, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-mist-dim">{s.stat}</span>
                            <span className="stat-num text-mist">
                              {fmt(s.stat, s.value, s.isPercent)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right: weapon + talents */}
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="text-base font-semibold text-white">Weapon</h2>
            {c.weapon ? (
              <div className="mt-3 flex items-center gap-3">
                {c.weapon.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.weapon.icon} alt="" className="h-12 w-12" />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-ink-800" />
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white">
                    {c.weapon.name ?? c.weapon.id}
                  </div>
                  <div className="stat-num mt-0.5 text-xs text-mist-dim">
                    Lv {c.weapon.level ?? "-"} · R{c.weapon.refinement ?? 1} ·{" "}
                    <span className="text-gold-300">{"★".repeat(Number(c.weapon.rarity) || 0)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="page-sub">No weapon equipped.</p>
            )}
          </section>

          {!!c.talents && (
            <section className="card p-5">
              <h2 className="text-base font-semibold text-white">Talent levels</h2>
              <div className="mt-3 space-y-2.5">
                {(
                  [
                    ["normal", "Normal Attack"],
                    ["skill", "Elemental Skill"],
                    ["burst", "Elemental Burst"],
                  ] as const
                ).map(([key, label]) => {
                  const t = (c as any).talents?.[key];
                  if (!t || (!t.name && !t.level)) return null;
                  return (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[11px] text-mist-faint">{label}</div>
                        <div className="truncate text-sm text-mist">{t.name ?? "-"}</div>
                      </div>
                      <div className="stat-num grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-ink-850 text-sm text-white">
                        {t.level ?? "-"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
