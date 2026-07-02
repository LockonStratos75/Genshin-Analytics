import "server-only";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ThumbsUp, ThumbsDown } from "lucide-react";
import db from "@/data/workshop-db.json";
import { elementColor } from "@/lib/display";

type Guide = {
  slug: string;
  name: string;
  element?: string;
  weapon_type?: string;
  ["role(s)"]?: string[];
  lore?: { short?: string };
  weapons?: Array<{
    name: string;
    rarity?: string;
    recommended_refinement?: string;
    rank?: number;
    notes?: string;
  }>;
  artifacts?: Array<{ set: string; notes?: string }>;
  main_stats?: Record<"Sands" | "Goblet" | "Circlet", string>;
  substats_priority?: string[];
  er_requirements?: Array<{ condition: string; value: string }>;
  talent_priority?: string[];
  team_comps?: Array<{
    name: string;
    members: Array<{ name: string; role?: string }>;
    notes?: string;
  }>;
  pros_cons?: { pros?: string[]; cons?: string[]; playstyle_notes?: string[] };
  materials?: { character_ascension?: string[]; talent_ascension?: string[] };
};

export function generateStaticParams() {
  return (db as Guide[]).map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const g = (db as Guide[]).find((x) => x.slug === params.slug);
  return { title: g ? `${g.name} Build Guide · Genshin Analytics` : "Build Guide" };
}

/* ---------- filename helpers (match local .webp names) ---------- */

function toWebpFilename(display: string) {
  let x = (display || "")
    .normalize("NFKD")
    .replace(/[‘’]/g, "'")
    .replace(/[–—-]/g, "_")
    .replace(/\s+/g, "_");
  x = x.replace(/[^A-Za-z0-9_']/g, "_");
  x = x.replace(/_+/g, "_").replace(/^_+|_+$/g, "");
  return `${x}.webp`;
}

const charIcon = (name: string) => `/character_imgs/${encodeURIComponent(toWebpFilename(name))}`;
const weaponIcon = (name: string) => `/weapons_imgs/${encodeURIComponent(toWebpFilename(name))}`;

function extractArtifactSetName(label: string) {
  let s = (label || "").trim();
  s = s.replace(/\b(\d+)\s*[- ]*\s*(?:pc|piece|pieces)\b/gi, "").trim();
  const first = s.split(/\s*(?:\+|\/|,|&|\band\b)\s*/i)[0]?.trim() || s;
  return first.replace(/\s{2,}/g, " ");
}
const artifactIcon = (label: string) =>
  `/artifact_imgs/${encodeURIComponent(toWebpFilename(extractArtifactSetName(label)))}`;

/* ---------- team member alias resolver ---------- */

const CHAR_ALIASES: Record<string, string> = {
  raiden: "Raiden Shogun",
  shogun: "Raiden Shogun",
  ei: "Raiden Shogun",
  yae: "Yae Miko",
  sara: "Kujou Sara",
  kazu: "Kaedehara Kazuha",
  kazuha: "Kaedehara Kazuha",
  ayaka: "Kamisato Ayaka",
  ayato: "Kamisato Ayato",
  kokomi: "Sangonomiya Kokomi",
  heizou: "Shikanoin Heizou",
  shinobu: "Kuki Shinobu",
  itto: "Arataki Itto",
  hutao: "Hu Tao",
  "hu tao": "Hu Tao",
  scaramouche: "Wanderer",
  childe: "Tartaglia",
  focalors: "Furina",
};

function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
    .join(" ");
}

function teamMemberIcon(raw: string) {
  const base = (raw || "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const candidates = base.split(/\s*(?:\/|,|\+|&|\band\b|\bor\b)\s*/i).filter(Boolean);
  for (const cand of candidates) {
    const key = cand.toLowerCase().trim();
    const canonical = CHAR_ALIASES[key] || titleCase(cand.trim());
    return charIcon(canonical);
  }
  return charIcon(titleCase(base));
}

/* ------------------------------ page ------------------------------ */

export default function GuidePage({ params }: { params: { slug: string } }) {
  const g = (db as Guide[]).find((x) => x.slug === params.slug);
  if (!g) {
    return (
      <div className="card p-8 text-center">
        <h1 className="text-lg font-semibold text-white">Guide not found</h1>
        <p className="page-sub">There is no build guide for &quot;{params.slug}&quot; yet.</p>
        <Link href="/workshop" className="btn-ghost mt-4">
          All guides
        </Link>
      </div>
    );
  }

  const el = elementColor(g.element);
  const rankedWeapons = (g.weapons ?? []).slice().sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));

  return (
    <div>
      <Link
        href="/workshop"
        className="inline-flex items-center gap-1.5 text-sm text-mist-dim transition-colors hover:text-mist"
      >
        <ArrowLeft size={15} strokeWidth={1.5} /> Build Guides
      </Link>

      {/* Header */}
      <header className="card relative mt-4 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(640px 280px at 10% 0%, ${el}1c, transparent 70%)` }}
        />
        <div className="relative flex flex-wrap items-center gap-5 p-6 md:p-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={charIcon(g.name)}
            alt={g.name}
            className="h-24 w-24 rounded-xl border border-white/10 object-cover"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-semibold tracking-tight text-white">{g.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {g.element && (
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ backgroundColor: `${el}1f`, color: el }}
                >
                  {g.element}
                </span>
              )}
              {g.weapon_type && <span className="text-xs text-mist-faint">{g.weapon_type}</span>}
            </div>
            {g.lore?.short && (
              <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-mist-dim">
                {g.lore.short}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(g["role(s)"] ?? []).map((r) => (
                <span
                  key={r}
                  className="rounded-full border border-white/10 bg-ink-950/60 px-2.5 py-1 text-[11px] text-mist-dim"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="mt-8 space-y-10">
        {/* Weapons */}
        {!!rankedWeapons.length && (
          <section id="weapons">
            <h2 className="text-xl font-semibold text-white">Best weapons</h2>
            <p className="page-sub">Ranked from best in slot downward.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {rankedWeapons.map((w) => (
                <div key={`${w.rank}-${w.name}`} className="card flex gap-3.5 p-4">
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={weaponIcon(w.name)}
                      alt={w.name}
                      className="h-13 w-13 h-[52px] w-[52px] rounded-lg border border-white/10 object-cover"
                    />
                    {w.rank ? (
                      <span className="stat-num absolute -left-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-gold-500 text-[10px] font-bold text-ink-950">
                        {w.rank}
                      </span>
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white">
                      {w.name}
                      {w.rarity && <span className="ml-1.5 text-xs text-gold-300">{w.rarity}</span>}
                      {w.recommended_refinement && (
                        <span className="stat-num ml-2 rounded-full bg-ink-800 px-1.5 py-0.5 text-[10px] text-mist-dim">
                          {w.recommended_refinement}
                        </span>
                      )}
                    </div>
                    {w.notes && (
                      <p className="mt-1 text-[13px] leading-relaxed text-mist-dim">{w.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Artifacts + stat priority */}
        {!!g.artifacts?.length && (
          <section id="artifacts">
            <h2 className="text-xl font-semibold text-white">Artifacts and stats</h2>
            {(g.main_stats || g.substats_priority || g.er_requirements) && (
              <div className="card mt-4 p-5">
                {g.main_stats && (
                  <div className="grid gap-4 sm:grid-cols-3">
                    {(["Sands", "Goblet", "Circlet"] as const).map((slot) => (
                      <div key={slot}>
                        <div className="text-[11px] uppercase tracking-wider text-mist-faint">
                          {slot}
                        </div>
                        <div className="mt-1 text-sm font-medium text-white">
                          {g.main_stats![slot]}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {g.substats_priority?.length ? (
                  <div className="mt-4 border-t border-white/[0.06] pt-4 text-sm">
                    <span className="text-mist-faint">Substats </span>
                    <span className="text-mist">
                      {g.substats_priority.join("  >  ")}
                    </span>
                  </div>
                ) : null}
                {g.er_requirements?.length ? (
                  <div className="mt-3 space-y-1.5">
                    {g.er_requirements.map((e) => (
                      <div key={e.condition} className="text-sm">
                        <span className="stat-num font-medium text-gold-300">{e.value}</span>
                        <span className="ml-2 text-mist-dim">{e.condition}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {g.artifacts.map((a, i) => (
                <div key={`${i}-${a.set}`} className="card flex gap-3.5 p-4">
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={artifactIcon(a.set)}
                      alt={a.set}
                      className="h-[52px] w-[52px] rounded-lg border border-white/10 object-cover"
                    />
                    <span className="stat-num absolute -left-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-gold-500 text-[10px] font-bold text-ink-950">
                      {i + 1}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white">{a.set}</div>
                    {a.notes && (
                      <p className="mt-1 text-[13px] leading-relaxed text-mist-dim">{a.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Teams */}
        {!!g.team_comps?.length && (
          <section id="teams">
            <h2 className="text-xl font-semibold text-white">Team compositions</h2>
            <div className="mt-4 space-y-4">
              {g.team_comps.map((t) => (
                <div key={t.name} className="card p-5">
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {t.members.map((m, idx) => (
                      <div key={`${t.name}-${m.name}-${idx}`} className="flex items-center gap-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={teamMemberIcon(m.name)}
                          alt={m.name}
                          className="h-10 w-10 shrink-0 rounded-lg border border-white/10 object-cover"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-medium text-white">{m.name}</div>
                          {m.role && (
                            <div className="truncate text-[11px] text-mist-faint">{m.role}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {t.notes && (
                    <p className="mt-3 border-t border-white/[0.06] pt-3 text-[13px] leading-relaxed text-mist-dim">
                      {t.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pros / Cons */}
        {(g.pros_cons?.pros?.length || g.pros_cons?.cons?.length) && (
          <section id="proscons">
            <h2 className="text-xl font-semibold text-white">Strengths and weaknesses</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="card p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-element-anemo">
                  <ThumbsUp size={15} strokeWidth={1.5} /> Strengths
                </div>
                <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-mist-dim">
                  {(g.pros_cons?.pros ?? []).map((p) => (
                    <li key={p} className="flex gap-2">
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-element-anemo" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-element-pyro">
                  <ThumbsDown size={15} strokeWidth={1.5} /> Weaknesses
                </div>
                <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-mist-dim">
                  {(g.pros_cons?.cons ?? []).map((c) => (
                    <li key={c} className="flex gap-2">
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-element-pyro" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {g.pros_cons?.playstyle_notes?.length ? (
              <div className="card mt-3 p-5">
                <div className="text-sm font-medium text-white">Playstyle and rotations</div>
                <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-mist-dim">
                  {g.pros_cons.playstyle_notes.map((n) => (
                    <li key={n} className="flex gap-2">
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-gold-400" />
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        )}

        {/* Materials */}
        {(g.materials?.character_ascension?.length || g.materials?.talent_ascension?.length) && (
          <section id="materials">
            <h2 className="text-xl font-semibold text-white">Ascension materials</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="card p-5">
                <div className="text-sm font-medium text-white">Character ascension</div>
                <ul className="mt-3 space-y-1.5 text-[13px] text-mist-dim">
                  {(g.materials?.character_ascension ?? []).map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
              <div className="card p-5">
                <div className="text-sm font-medium text-white">Talent materials</div>
                <ul className="mt-3 space-y-1.5 text-[13px] text-mist-dim">
                  {(g.materials?.talent_ascension ?? []).map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
