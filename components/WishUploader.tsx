"use client";
import { useRef, useState } from "react";
import useStore from "@/lib/store";
import * as XLSX from "xlsx";

export default function WishUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string>("");
  const setWishes = useStore(s => s.setWishes);

  async function handleFile(file: File) {
    setStatus("Parsing...");
    const ext = file.name.split(".").pop()?.toLowerCase();
    try {
      if (ext === "json") {
        const text = await file.text();
        const data = JSON.parse(text);
        const res = await fetch("/api/wish/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ json: data })
        });
        const parsed = await res.json();
        setWishes(parsed);
      } else if (ext === "xlsx") {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        const res = await fetch("/api/wish/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ json: rows })
        });
        const parsed = await res.json();
        setWishes(parsed);
      } else {
        throw new Error("Unsupported file type");
      }
      setStatus("Parsed ✓");
    } catch (e:any) {
      setStatus("Failed to parse: " + (e?.message ?? ""));
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center flex-wrap gap-3 justify-between">
        <div>
          <h2 className="text-lg font-semibold">Upload Wish History (.json / .xlsx)</h2>
          <p className="subtle">We support UIGF-like JSON and typical Excel exports.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => inputRef.current?.click()} className="px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10">Choose file</button>
          <button onClick={() => localStorage.removeItem("wishes")} className="px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10">Clear</button>
        </div>
        <input ref={inputRef} onChange={e=>e.target.files && handleFile(e.target.files[0])} type="file" accept=".json,.xlsx" className="hidden" />
      </div>
      {status && <p className="text-xs opacity-70 mt-2">{status}</p>}
    </div>
  );
}
