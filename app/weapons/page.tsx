import WeaponTable from "@/components/WeaponTable";
import DataUpload from "@/components/DataUpload";

export default function WeaponsPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Weapons</h1>
      <DataUpload kind="weapons" />
      <WeaponTable />
    </div>
  );
}
