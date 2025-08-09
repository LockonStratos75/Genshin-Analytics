"use client";
import useStore from "@/lib/store";

export default function RecentPulls() {
  const wishes = useStore(s => s.wishes);
  const recent = [...wishes].slice(-10).reverse();
  return (
    <section className="card p-5">
      <h2 className="text-xl font-semibold mb-2">Recent Pulls</h2>
      {recent.length === 0 ? (
        <p className="subtle">Connect your wish history or upload an export to see recent pulls and trends.</p>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left subtle">
              <tr><th className="py-2 pr-4">Time</th><th className="pr-4">Name</th><th className="pr-4">Rarity</th><th>Banner</th></tr>
            </thead>
            <tbody>
              {recent.map((w, i) => (
                <tr key={w.id+i} className="border-t border-black/5 dark:border-white/5">
                  <td className="py-2 pr-4">{new Date(w.time).toLocaleString()}</td>
                  <td className="pr-4">{w.name}</td>
                  <td className="pr-4">{w.rank_type}★</td>
                  <td className="capitalize">{w.banner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
