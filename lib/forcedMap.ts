
export type ForcedMap = Record<string,string>;

export function saveForcedMap(map: ForcedMap){
  try { if (typeof window !== "undefined") localStorage.setItem("forced_textmap", JSON.stringify(map)); } catch {}
}

export function loadForcedMap(): ForcedMap {
  if (typeof window === "undefined") return {};
  try {
    const v = localStorage.getItem("forced_textmap");
    return v ? JSON.parse(v) : {};
  } catch { return {}; }
}

export function nameFromForced(map: ForcedMap, type: "char"|"weapon"|"artifact_set"|"artifact_set_hash", id: string){
  return map[`${type}:${id}`];
}
