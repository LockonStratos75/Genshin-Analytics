"use client";
import useStore from "@/lib/store";

export default function PityDetails() {
  const pity = useStore(s => s.pity);
  return (
    <div className="card p-4">
      <h2 className="text-lg font-semibold mb-2">Banner Pity</h2>
      <div className="grid sm:grid-cols-3 gap-3">
        {Object.entries(pity).map(([k,v]) => (
          <div key={k} className="p-3 rounded-lg bg-white/70 dark:bg-white/10">
            <div className="capitalize subtle">{k}</div>
            <div className="text-2xl font-semibold">{v as any}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
