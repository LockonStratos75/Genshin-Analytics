
import { NextRequest, NextResponse } from "next/server";

function slugify(name: string){
  return name.toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, '')
    .replace(/['\s]/g, '-')
    .replace(/-+/g, '-');
}

async function fetchOne(name: string){
  const slug = slugify(name);
  const url = `https://api.genshin.dev/characters/${slug}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" });
  if (!res.ok) return { name, ok: false };
  const data = await res.json();
  return {
    name,
    ok: true,
    element: data?.vision ?? data?.element ?? null,
    weapon: data?.weapon ?? null,
    nation: data?.nation ?? null,
    rarity: data?.rarity ?? null,
    title: data?.title ?? null,
    description: data?.description ?? null,
    constellation: data?.constellation ?? null,
    images: data?.images ?? null
  };
}

export async function POST(req: NextRequest){
  const { names } = await req.json();
  if (!Array.isArray(names) || names.length === 0) return NextResponse.json({ error: "names required" }, { status: 400 });
  const results = await Promise.all(names.map(fetchOne));
  const map: Record<string, any> = {};
  for (const r of results) map[r.name] = r;
  return NextResponse.json({ results: map });
}
