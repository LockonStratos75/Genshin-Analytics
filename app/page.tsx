import PityWidget from "@/components/PityWidget";
import QuickStats from "@/components/QuickStats";
import RecentPulls from "@/components/RecentPulls";

export default function Page() {
  return (
    <div className="grid gap-6">
      <div className="grid md:grid-cols-3 gap-6">
        <QuickStats />
        <PityWidget />
      </div>
      <RecentPulls />
    </div>
  );
}
