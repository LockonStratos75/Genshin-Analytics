import { getAllArtifactSets } from "@/lib/gamedata";
import ArtifactsBrowser from "@/components/artifacts/ArtifactsBrowser";

export const metadata = { title: "Artifacts · Genshin Analytics" };

export default function ArtifactsPage() {
  const sets = getAllArtifactSets();
  return (
    <div>
      <h1 className="page-title">Artifacts</h1>
      <p className="page-sub">
        All {sets.length} artifact sets with their bonuses, and roll-value scores for the pieces
        your characters wear.
      </p>
      <ArtifactsBrowser sets={sets} />
    </div>
  );
}
