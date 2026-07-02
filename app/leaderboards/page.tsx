import { Suspense } from "react";
import { getAllCharacters } from "@/lib/gamedata";
import LeaderboardsBrowser from "@/components/leaderboards/LeaderboardsBrowser";

export const metadata = { title: "Leaderboards · Genshin Analytics" };

export default function LeaderboardsPage() {
  const characters = getAllCharacters().filter((c) => c.id && c.name !== "Aether" && c.name !== "Lumine");
  return (
    <div>
      <h1 className="page-title">Leaderboards</h1>
      <p className="page-sub">
        Global damage rankings from the Akasha System. Pick a character, then compare against the
        top builds or look up your own UID.
      </p>
      <Suspense>
        <LeaderboardsBrowser characters={characters} />
      </Suspense>
    </div>
  );
}
