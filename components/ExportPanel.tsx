"use client";
import useStore from "@/lib/store";
import Papa from "papaparse";

export default function ExportPanel(){
  const wishes = useStore(s => s.wishes);
  const download = () => {
    const csv = Papa.unparse(wishes);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "wishes.csv"; a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="card p-4">
      <h3 className="font-semibold mb-2">Export</h3>
      <button onClick={download} className="px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10">Export Wish History (CSV)</button>
    </div>
  );
}
