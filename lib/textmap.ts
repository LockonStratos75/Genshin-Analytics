
export type TextMap = Record<string, string>;

let textMap: TextMap = {};

export function setTextMap(map: TextMap) {
  textMap = map || {};
  try { if (typeof window !== "undefined") localStorage.setItem("textmap", JSON.stringify(textMap)); } catch {}
}

export function loadTextMap(): TextMap {
  if (typeof window === "undefined") return textMap;
  try {
    const v = localStorage.getItem("textmap");
    textMap = v ? JSON.parse(v) : {};
  } catch {}
  return textMap;
}

export async function fetchAndSetTextMap(url: string) {
  const res = await fetch(url);
  const json = await res.json();
  setTextMap(json);
  return Object.keys(json).length;
}

export function t(hash: string | number | undefined, fallback?: string): string {
  if (hash === undefined || hash === null) return fallback ?? "";
  const key = String(hash);
  const val = textMap[key];
  return val ?? (fallback ?? key);
}
