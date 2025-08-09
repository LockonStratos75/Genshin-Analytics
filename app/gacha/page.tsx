import WishUploader from "@/components/WishUploader";
import PityDetails from "@/components/PityDetails";
import GachaCharts from "@/components/GachaCharts";

export default function GachaPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Gacha History</h1>
      <WishUploader />
      <PityDetails />
      <GachaCharts />
    </div>
  );
}
