// path: lib/workshop-types.ts
export type WeaponEntry = {
    name: string;
    rarity: string; // e.g. "5★"
    recommended_refinement?: string;
    rank: number;
    notes?: string;
};

export type ArtifactEntry = {
    set: string; // can include "4pc", "2pc mix", etc.
    notes?: string;
};

export type TeamMember = { name: string; role?: string; icon?: string };
export type TeamComp = { name: string; members: TeamMember[]; notes?: string };

export type ERNeed = { condition: string; value: string };

export type GuideDoc = {
    icon: string | undefined;
    slug: string;
    name: string;
    element: string;
    weapon_type: "Sword" | "Claymore" | "Polearm" | "Bow" | "Catalyst" | string;
    "role(s)"?: string[];
    lore?: { short?: string };
    weapons?: WeaponEntry[];
    artifacts?: ArtifactEntry[];
    main_stats?: Record<"Sands" | "Goblet" | "Circlet" | string, string>;
    substats_priority?: string[];
    er_requirements?: ERNeed[];
    talent_priority?: string[];
    team_comps?: TeamComp[];
    pros_cons?: { pros?: string[]; cons?: string[]; playstyle_notes?: string[] };
    materials?: {
        character_ascension?: string[];
        talent_ascension?: string[];
    };
};

export type GuideSummary = Pick<
    GuideDoc,
    "slug" | "name" | "element" | "weapon_type"
> & { roles?: string[] };
