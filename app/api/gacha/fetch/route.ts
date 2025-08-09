import { NextRequest, NextResponse } from "next/server";
import { limiter } from "@/app/api/_utils";
import type { Wish } from "@/lib/types";

export async function POST(req: NextRequest){
  if (!limiter(req.ip ?? "anon")) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  const { url } = await req.json();
  if (!url || typeof url !== "string") return NextResponse.json({ error: "Missing url" }, { status: 400 });

  // Extract base & query
  const u = new URL(url);
  const base = `${u.origin}${u.pathname}`;
  const params = new URLSearchParams(u.search);
  const authkey = params.get("authkey");
  if (!authkey) return NextResponse.json({ error: "No authkey in URL" }, { status: 400 });

  async function fetchPage(gacha_type: string, end_id="0"){
    const p = new URLSearchParams(u.search);
    p.set("gacha_type", gacha_type);
    p.set("size", "20");
    p.set("end_id", end_id);
    const res = await fetch(`${base}?${p.toString()}`);
    const json = await res.json().catch(()=>({}));
    return json?.data ?? { list: [], end_id: "0" };
  }

  const gachaTypes = ["100","200","301","302"]; // novice, standard, char, weapon
  const wishes: Wish[] = [];
  for (const gt of gachaTypes){
    let end = "0";
    for (let i=0; i<30; i++){ // up to 600 pulls per banner in MVP
      const page = await fetchPage(gt, end);
      const list = page.list || [];
      for (const x of list){
        wishes.push({
          id: String(x.id),
          time: new Date(x.time).toISOString(),
          name: x.name,
          rank_type: String(x.rank_type) as any,
          item_type: x.item_type === "角色" ? "Character" : (x.item_type === "武器" ? "Weapon" : (x.item_type || "Weapon")),
          banner: gt === "301" ? "character" : gt === "302" ? "weapon" : "standard"
        });
      }
      if (!list.length || page.list.length < 20) break;
      end = page.list[page.list.length-1].id;
    }
  }

  return NextResponse.json(wishes);
}
