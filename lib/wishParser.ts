import type { Wish } from "./types";

type Input = any;

export function parseWishJSON(input: Input): Wish[] {
  if (!input) return [];
  const list = Array.isArray(input) ? input : (input?.list || input?.wishes || input?.data || input || []);

  const mapBanner = (gachaType: string): Wish["banner"] => {
    if (gachaType === "301" || gachaType === "400" || /character/i.test(gachaType)) return "character";
    if (gachaType === "302" || /weapon/i.test(gachaType)) return "weapon";
    return "standard";
  };

  return list.map((x: any, idx: number) => ({
    id: String(x.id ?? x.uid ?? idx),
    time: new Date(x.time ?? x.timestamp ?? x.date ?? Date.now()).toISOString(),
    name: String(x.name ?? x.item ?? x.item_name ?? "Unknown"),
    rank_type: String(x.rank_type ?? x.rank ?? x.rarity ?? 3) as Wish["rank_type"],
    item_type: (x.item_type === "Weapon" || x.item_type === "Character") ? x.item_type : (/weapon/i.test(x.item_type) ? "Weapon" : "Character"),
    banner: mapBanner(String(x.gacha_type ?? x.banner ?? x.pool ?? ""))
  })).filter(Boolean);
}
