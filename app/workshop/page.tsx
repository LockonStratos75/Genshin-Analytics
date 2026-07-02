import db from "@/data/workshop-db.json";
import GuidesBrowser from "@/components/workshop/GuidesBrowser";

export const metadata = { title: "Build Guides · Genshin Analytics" };

export default function WorkshopPage() {
  const guides = (db as any[]).map((g) => ({
    slug: g.slug,
    name: g.name,
    element: g.element ?? "",
    weaponType: g.weapon_type ?? "",
    roles: g["role(s)"] ?? [],
    blurb: g.lore?.short ?? "",
  }));

  return (
    <div>
      <h1 className="page-title">Build Guides</h1>
      <p className="page-sub">
        Curated builds: best weapons, artifact sets, stat priorities, and team compositions for{" "}
        {guides.length} characters.
      </p>
      <GuidesBrowser guides={guides} />
    </div>
  );
}
