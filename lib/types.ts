export type Wish = {
  id: string;
  time: string; // ISO
  name: string;
  rank_type: "3" | "4" | "5";
  item_type: "Character" | "Weapon";
  banner: "standard" | "character" | "weapon";
};

export type Pity = { standard: number; character: number; weapon: number };

export type Character = {
  id?: string;
  name: string;
  element?: "Pyro"|"Hydro"|"Anemo"|"Electro"|"Dendro"|"Cryo"|"Geo";
  level?: number;
  constellations?: number;
  talents?: number[];
  weapon?: { name: string; refinement?: number };
  artifacts?: any[];
};

export type Weapon = {
  id?: string;
  name: string;
  type?: string;
  rarity?: number;
  baseAtk?: number;
  refinement?: number;
};

export type Artifact = {
  id?: string;
  set: string;
  rarity: number;
  level?: number;
  slot?: string;
  mainstat?: { stat: string, value: number };
  substats?: { stat:string, value:number }[];
};
