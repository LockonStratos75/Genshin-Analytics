"use client";
import CharacterGrid from "@/components/CharacterGrid";
import {Suspense} from "react";

export default function CharactersPage() {
    return (
        <div className="p-4">
            <h1 className="text-2xl font-semibold mb-4">Characters</h1>
            <Suspense fallback={<div className="opacity-70 p-4">Loading characters…</div>}>
            <CharacterGrid />
            </Suspense>
        </div>
    );
}
