"use client";
import { useRef, useState } from "react";
import useStore from "@/lib/store";

type Kind = "characters" | "weapons" | "artifacts";

export default function DataUpload({ kind }: { kind: Kind }){
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const setData = useStore(s => ({
    characters: s.setCharacters,
    weapons: s.setWeapons,
    artifacts: s.setArtifacts
  })[kind]);

  async function onFile(file: File){
    try{
      const text = await file.text();
      const json = JSON.parse(text);
      setData(json);
      setStatus("Loaded ✓");
    }catch(e:any){
      setStatus("Failed to parse JSON");
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold capitalize">{kind} data</h3>
          <p className="subtle">Upload {kind} JSON exported from your source (akasha-like).</p>
        </div>
        <button onClick={()=>inputRef.current?.click()} className="px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10">Upload JSON</button>
        <input ref={inputRef} onChange={e=>e.target.files && onFile(e.target.files[0])} type="file" accept="application/json" className="hidden"/>
      </div>
      {status && <p className="text-xs opacity-70 mt-2">{status}</p>}
    </div>
  );
}
