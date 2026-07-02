// Client-safe display tokens shared across pages.

export const ELEMENT_COLORS: Record<string, string> = {
  Pyro: "#ff8a65",
  Hydro: "#54c8f0",
  Electro: "#b48fff",
  Cryo: "#a3ddec",
  Anemo: "#71e0b5",
  Geo: "#f2c14e",
  Dendro: "#a8ce45",
};

export const RARITY_COLORS: Record<number, string> = {
  5: "#ffb547",
  4: "#b39ce8",
  3: "#6fa8dc",
  2: "#7fbd8f",
  1: "#9aa3b5",
};

export function elementColor(el?: string | null) {
  return (el && ELEMENT_COLORS[el]) || "#9aa3b5";
}

export function rarityColor(r?: number | null) {
  return (r && RARITY_COLORS[r]) || "#9aa3b5";
}

export function rarityStars(r?: number | null) {
  return "★".repeat(Math.max(0, Math.min(5, Number(r) || 0)));
}

export function enkaIcon(filename?: string | null) {
  return filename ? `https://enka.network/ui/${filename}.png` : "";
}

export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatNum(n: number | null | undefined, digits = 0) {
  if (n == null || Number.isNaN(Number(n))) return "-";
  return Number(n).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Strip in-game color markup like <color=#99FFFFFF>…</color> from descriptions. */
export function cleanDesc(s?: string | null) {
  if (!s) return "";
  return s
    .replace(/<\/?color[^>]*>/gi, "")
    .replace(/<\/?i>/gi, "")
    .replace(/\\n/g, "\n");
}
