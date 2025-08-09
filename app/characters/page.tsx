"use client";
import CharacterGrid from "@/components/CharacterGrid";

export default function CharactersPage() {
    return (
        <div className="p-4">
            <h1 className="text-2xl font-semibold mb-4">Characters</h1>
            <CharacterGrid />
        </div>
    );
}
