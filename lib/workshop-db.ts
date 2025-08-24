// lib/workshop-db.ts
import fs from "node:fs";
import path from "node:path";

export type Guide = any;

function readJson(): Guide[] {
    const p = path.join(process.cwd(), "data", "workshop-db.json");
    const raw = fs.readFileSync(p, "utf-8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
}

function candidatesForCharacter(name: string) {
    const q = (s: string) => `/api/workshop/image?q=${encodeURIComponent(s)}`;
    return [
        q(`${name} icon genshin impact wiki`),
        q(`${name} icon genshin impact fandom`),
        q(`${name} portrait genshin`),
    ];
}
function candidatesForWeapon(name: string) {
    const q = (s: string) => `/api/workshop/image?q=${encodeURIComponent(s)}`;
    return [
        q(`${name} weapon icon genshin impact wiki`),
        q(`${name} weapon icon fandom`),
        q(`${name} weapon genshin icon`),
    ];
}
function candidatesForArtifact(name: string) {
    const q = (s: string) => `/api/workshop/image?q=${encodeURIComponent(s)}`;
    return [
        q(`${name} artifact icon genshin impact wiki`),
        q(`${name} artifact icon fandom`),
        q(`${name} artifact flower icon genshin`),
    ];
}

export async function listGuides(): Promise<Guide[]> {
    const rows = readJson();

    return rows.map((g: any) => {
        const weaponNames = (g.weapons || []).map((w: any) => w.name);
        const artNames = (g.artifacts || []).map((a: any) => a.set);

        return {
            ...g,
            iconCandidates: candidatesForCharacter(g.name),
            _weaponIconCandidates: Object.fromEntries(
                weaponNames.map((n: string) => [n, candidatesForWeapon(n)])
            ),
            _artifactIconCandidates: Object.fromEntries(
                artNames.map((n: string) => [n, candidatesForArtifact(n)])
            ),
        };
    });
}

export async function getGuide(slug: string): Promise<Guide | null> {
    const rows = await listGuides();
    return rows.find((x: any) => x.slug === slug) ?? null;
}
