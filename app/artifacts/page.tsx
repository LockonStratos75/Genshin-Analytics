import ArtifactGrid from "@/components/ArtifactGrid";
import DataUpload from "@/components/DataUpload";

export default function ArtifactsPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Artifacts</h1>
      <DataUpload kind="artifacts" />
      <ArtifactGrid />
    </div>
  );
}
