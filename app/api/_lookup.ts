
let textMap: Record<string,string> | null = null;
let charStore: any | null = null;
let weaponStore: any | null = null;
let artifactStore: any | null = null;

const LOC_URLS = [
  "https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/loc.json",
  "https://raw.githubusercontent.com/Dimbreath/GenshinData/master/TextMap/TextMapEN.json"
];
const CHAR_URL = "https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/characters.json";
const WEAPON_URL = "https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/weapons.json";
const ARTIFACT_URL = "https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/artifacts.json";

const FALLBACK_NAMES: Record<string,string> = {
  "10000087": "Neuvillette",
  "10000059": "Hu Tao",
  "10000032": "Diluc",
  "10000079": "Xiangling",
  "10000023": "Xingqiu",
  "10000098": "Wanderer",
  "10000114": "Wriothesley",
  "10000015": "Kaeya",
  "10000034": "Noelle",
  "10000103": "Navia",
  "10000031": "Fischl"
};

async function fetchJson(url: string){
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  return await res.json();
}

export async function ensureTextMap(){
  if (textMap) return textMap;
  for (const url of LOC_URLS){
    try { textMap = await fetchJson(url); return textMap!; } catch {}
  }
  textMap = {}; return textMap;
}

export async function ensureStores(){
  if (!charStore) try { charStore = await fetchJson(CHAR_URL); } catch {}
  if (!weaponStore) try { weaponStore = await fetchJson(WEAPON_URL); } catch {}
  if (!artifactStore) try { artifactStore = await fetchJson(ARTIFACT_URL); } catch {}
  return { charStore, weaponStore, artifactStore };
}

export async function tByHash(hash?: string|number, fallback?: string){
  if (hash === undefined || hash === null) return fallback ?? "";
  const tm = await ensureTextMap();
  const key = String(hash);
  return tm[key] ?? (fallback ?? key);
}

export async function getCharacterMeta(id: number|string){
  await ensureStores(); await ensureTextMap();
  const sid = String(id);
  const c = charStore?.[sid] || {};
  let name: string | undefined = c.Name;
  if (!name && c.NameTextMapHash) name = await tByHash(c.NameTextMapHash, undefined);
  if (!name) name = FALLBACK_NAMES[sid] ?? sid;
  const vision = c.Element || c.Vision || null;
  const weapon = c.Weapon || c.WeaponType || null;
  const rar = c.Rarity || c.Quality || null;
  const icon = c.Icon || c.SideIconName || c.BodyIconName || null;
  return {
    name,
    vision,
    weaponType: weapon,
    rarity: rar,
    icon: icon ? `https://enka.network/ui/${icon}.png` : null
  };
}

export async function getWeaponMeta(id: number|string, nameHash?: string|number){
  await ensureStores(); await ensureTextMap();
  const w = weaponStore?.[String(id)] || {};
  const name = w.Name || await tByHash(nameHash ?? w.NameTextMapHash, String(id));
  const type = w.Weapon || w.WeaponType || null;
  const icon = w.Icon ? `https://enka.network/ui/${w.Icon}.png` : null;
  const rarity = w.Rarity ?? w.Rank ?? null;
  return { name, type, icon, rarity };
}

export async function getArtifactSetMeta(setHash: string|number){
  await ensureStores(); await ensureTextMap();
  // artifacts.json keys are set IDs; each item has TextMap hashes for names/affixes
  const entries = Object.values(artifactStore || {}) as any[];
  for (const s of entries){
    const textHash = String(s.EquipAffixNameTextMapHash ?? s.SetNameTextMapHash);
    if (textHash === String(setHash)){
      const name = await tByHash(textHash, String(setHash));
      const two = s.Affix2DescTextMapHash ? await tByHash(s.Affix2DescTextMapHash, "") :
                 s.Affix2 ? await tByHash(s.Affix2, "") : "";
      const four = s.Affix4DescTextMapHash ? await tByHash(s.Affix4DescTextMapHash, "") :
                  s.Affix4 ? await tByHash(s.Affix4, "") : "";
      return { name, twoPiece: two, fourPiece: four };
    }
  }
  const name = await tByHash(setHash, String(setHash));
  return { name, twoPiece: "", fourPiece: "" };
}
