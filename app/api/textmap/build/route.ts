
import { NextRequest, NextResponse } from "next/server";

const BASE = "https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store";
const URLS = {
  loc: `${BASE}/loc.json`,
  characters: `${BASE}/characters.json`,
  weapons: `${BASE}/weapons.json`,
  artifacts: `${BASE}/artifacts.json`
};

async function get(url: string){
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
}

export async function GET(){
  const [loc, chars, weapons, arts] = await Promise.all([
    get(URLS.loc).catch(()=> ({})),
    get(URLS.characters).catch(()=> ({})),
    get(URLS.weapons).catch(()=> ({})),
    get(URLS.artifacts).catch(()=> ({}))
  ]);

  const map: Record<string,string> = {};

  // characters.json keys are avatar IDs
  for (const [id, c] of Object.entries<any>(chars)){
    const name = c?.Name ?? (c?.NameTextMapHash ? loc[String(c.NameTextMapHash)] : null) ?? String(id);
    map[`char:${id}`] = name;
  }

  // weapons.json keys are item IDs
  for (const [id, w] of Object.entries<any>(weapons)){
    const name = w?.Name ?? (w?.NameTextMapHash ? loc[String(w.NameTextMapHash)] : null) ?? String(id);
    map[`weapon:${id}`] = name;
  }

  // artifacts.json: store set names by set id and by text hash
  for (const [setId, s] of Object.entries<any>(arts)){
    const hash = String(s?.EquipAffixNameTextMapHash ?? s?.SetNameTextMapHash ?? "");
    const name = (hash && loc[hash]) ? loc[hash] : (s?.Name || s?.SetName || String(setId));
    map[`artifact_set:${setId}`] = name;
    if (hash) map[`artifact_set_hash:${hash}`] = name;
  }

  return NextResponse.json({ ok: true, count: Object.keys(map).length, map });
}
