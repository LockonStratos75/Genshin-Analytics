import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";
import { getAllCharacters, getCharacterBySlug } from "@/lib/gamedata";
import { elementColor, rarityColor, formatNum } from "@/lib/display";
import CharacterLeaderboards from "@/components/characters/CharacterLeaderboards";
import workshopDb from "@/data/workshop-db.json";

export function generateStaticParams() {
  return getAllCharacters().map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const c = getAllCharacters().find((x) => x.slug === params.slug);
  return { title: c ? `${c.name} · Genshin Analytics` : "Character" };
}

const STAT_LABELS: Record<string, string> = {
  hp: "Max HP",
  attack: "ATK",
  defense: "DEF",
};

export default function CharacterDetailPage({ params }: { params: { slug: string } }) {
  const c = getCharacterBySlug(params.slug);
  if (!c) notFound();

  const guides = workshopDb as any[];
  const guide = guides.find((g) => g.slug === c.slug);
  const el = elementColor(c.element);

  return (
    <div>
      {/* Hero */}
      <div className="card relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(700px 320px at 85% 20%, ${el}1f, transparent 70%)` }}
        />
        <div className="relative grid gap-6 p-6 md:grid-cols-[1fr_320px] md:p-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ backgroundColor: `${el}1f`, color: el }}
              >
                {c.element}
              </span>
              <span className="text-xs text-mist-faint">{c.weaponType}</span>
              {c.region && <span className="text-xs text-mist-faint">{c.region}</span>}
              <span className="stat-num text-sm" style={{ color: rarityColor(c.rarity) }}>
                {"★".repeat(c.rarity)}
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              {c.name}
            </h1>
            {c.title && <div className="mt-1 text-sm text-gold-300">{c.title}</div>}
            {c.description && (
              <p className="mt-4 max-w-[60ch] text-sm leading-relaxed text-mist-dim">
                {c.description}
              </p>
            )}

            {/* Lv90 stats */}
            {c.stats90 && (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Object.entries(STAT_LABELS).map(([key, label]) => (
                  <div key={key} className="rounded-lg border border-white/[0.07] bg-ink-950/50 p-3">
                    <div className="text-[11px] uppercase tracking-wider text-mist-faint">
                      {label}
                    </div>
                    <div className="stat-num mt-1 text-lg text-white">
                      {formatNum((c.stats90 as any)[key])}
                    </div>
                  </div>
                ))}
                <div className="rounded-lg border border-white/[0.07] bg-ink-950/50 p-3">
                  <div className="text-[11px] uppercase tracking-wider text-mist-faint">
                    {c.substat || "Bonus stat"}
                  </div>
                  <div className="stat-num mt-1 text-lg text-white">
                    {c.stats90.specialized != null
                      ? c.stats90.specialized < 3
                        ? `${(c.stats90.specialized * 100).toFixed(1)}%`
                        : formatNum(c.stats90.specialized)
                      : "-"}
                  </div>
                </div>
              </div>
            )}

            {guide && (
              <Link
                href={`/workshop/${guide.slug}`}
                className="btn-primary mt-6"
              >
                <BookOpen size={15} strokeWidth={1.5} />
                Read the {c.name} build guide
              </Link>
            )}
          </div>

          {c.splash ? (
            <div className="relative hidden md:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.splash}
                alt={`${c.name} splash art`}
                className="absolute inset-0 h-full w-full scale-125 object-cover object-[center_20%] [mask-image:linear-gradient(to_left,black_60%,transparent)]"
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Talents + Constellations */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-lg font-semibold text-white">Talents</h2>
          <div className="mt-4 space-y-4">
            {c.talents.map((t: any, i: number) => (
              <div key={i} className="flex gap-3">
                <div
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: el }}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white">
                    {t.name}
                    <span className="ml-2 text-xs font-normal text-mist-faint">{t.kind}</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-mist-dim">{t.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-lg font-semibold text-white">
            Constellations
            {c.constellationName && (
              <span className="ml-2 text-sm font-normal text-mist-faint">
                {c.constellationName}
              </span>
            )}
          </h2>
          <div className="mt-4 space-y-4">
            {c.constellations.map((k: any) => (
              <div key={k.position} className="flex gap-3">
                <div className="stat-num mt-0.5 shrink-0 text-sm text-gold-400">C{k.position}</div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white">{k.name}</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-mist-dim">{k.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Leaderboards */}
      {c.id ? (
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-white">Leaderboards</h2>
          <p className="page-sub">
            Top builds worldwide from the Akasha System, ranked by calculated damage.
          </p>
          <div className="mt-4">
            <CharacterLeaderboards characterId={c.id} accent={el} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
