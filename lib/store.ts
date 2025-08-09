// lib/store.ts
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** ---- Types ---- */
type Pity = { character: number; weapon: number; standard: number };

type Stats = {
    characters: number;
    artifactAvgScore: number | null;
    fiveStarRate: number | null; // % across all wishes stored
    last10: string | null;       // joined list of last 10 pulls, or anything you want
};

// Keep wish item loose so you can plug different parsers.
// If you want strong types: extend with banner, time, itemType etc.
type Wish = any;

/** ---- Initial values ---- */
const initialStats: Stats = {
    characters: 0,
    artifactAvgScore: null,
    fiveStarRate: null,
    last10: null,
};

const initialPity: Pity = { character: 0, weapon: 0, standard: 0 };

/** ---- Store shape ---- */
type GAState = {
    // Core data
    characters: any[];
    weapons: any[];
    artifacts: any[];

    // Extra
    pity: Pity;
    wishes: Wish[];

    // Aggregates
    stats: Stats;

    // Setters
    setCharacters: (v: any[]) => void;
    setWeapons: (v: any[]) => void;
    setArtifacts: (v: any[]) => void;

    setPity: (v: Partial<Pity>) => void;

    setWishes: (v: Wish[]) => void;
    appendWishes: (v: Wish[]) => void;

    setStats: (v: Partial<Stats>) => void;

    // Utils
    clear: () => void;
};

/** ---- Helpers ---- */
function computeArtifactAvgLevel(arts: any[]): number | null {
    if (!arts?.length) return null;
    const sum = arts.reduce((acc: number, a: any) => acc + Number(a?.level ?? 0), 0);
    return Number((sum / arts.length).toFixed(1));
}

function computeWishDerived(wishes: Wish[]): Pick<Stats, "fiveStarRate" | "last10"> {
    if (!Array.isArray(wishes) || wishes.length === 0) {
        return { fiveStarRate: null, last10: null };
    }
    const total = wishes.length;
    const fiveStar = wishes.filter((w: any) => Number(w?.rarity || w?.rank || w?.rank_type) === 5).length;
    const rate = Number(((fiveStar / total) * 100).toFixed(1));

    const last10 = wishes.slice(-10).map((w: any) => w?.name ?? w?.item_name ?? "★").join(", ");

    return { fiveStarRate: rate, last10 };
}

/** ---- Store ---- */
const useStore = create<GAState>()(
    persist(
        (set, get) => ({
            // data
            characters: [],
            weapons: [],
            artifacts: [],

            pity: initialPity,
            wishes: [],

            stats: initialStats,

            setCharacters: (v) => {
                set({ characters: v });
                const s = get().stats;
                set({ stats: { ...s, characters: Array.isArray(v) ? v.length : 0 } });
            },

            setWeapons: (v) => set({ weapons: v }),

            setArtifacts: (v) => {
                set({ artifacts: v });
                const s = get().stats;
                set({ stats: { ...s, artifactAvgScore: computeArtifactAvgLevel(v) } });
            },

            setPity: (v) => set((state) => ({ pity: { ...state.pity, ...v } })),

            setWishes: (v) => {
                const next = Array.isArray(v) ? v : [];
                set({ wishes: next });
                const s = get().stats;
                const derived = computeWishDerived(next);
                set({ stats: { ...s, ...derived } });
            },

            appendWishes: (v) => {
                const prev = get().wishes ?? [];
                const merged = prev.concat(Array.isArray(v) ? v : []);
                set({ wishes: merged });
                const s = get().stats;
                const derived = computeWishDerived(merged);
                set({ stats: { ...s, ...derived } });
            },

            setStats: (v) => set({ stats: { ...get().stats, ...v } }),

            clear: () =>
                set({
                    characters: [],
                    weapons: [],
                    artifacts: [],
                    wishes: [],
                    pity: initialPity,
                    stats: initialStats,
                }),
        }),
        {
            name: "ga-cache",
            storage: createJSONStorage(() => localStorage),
            version: 1,
        }
    )
);

export default useStore;
