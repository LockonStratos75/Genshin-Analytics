import { Suspense } from "react";
import { getAllCharacters } from "@/lib/gamedata";
import CharacterBrowser from "@/components/characters/CharacterBrowser";

export const metadata = { title: "Characters · Genshin Analytics" };

export default function CharactersPage() {
  const characters = getAllCharacters();
  return (
    <div>
      <h1 className="page-title">Characters</h1>
      <p className="page-sub">
        Every playable character in Teyvat, plus your own roster imported from Enka.Network.
      </p>
      <Suspense>
        <CharacterBrowser characters={characters} />
      </Suspense>
    </div>
  );
}
