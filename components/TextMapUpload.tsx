
"use client";
import { useEffect, useRef, useState } from "react";
import { setTextMap, loadTextMap, fetchAndSetTextMap } from "@/lib/textmap";

const MIRRORS = [
  "https://raw.githubusercontent.com/Dimbreath/GenshinData/master/TextMap/TextMapEN.json",
  "https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/en_us.json",
  "https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/loc.json"
];

export default function TextMapUpload(){
  const inputRef = useRef<HTMLInputElement>(null);
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState("");

  useEffect(()=>{
    const tm = loadTextMap();
    setCount(Object.keys(tm).length);
  },[]);

  async function onFile(file: File){
    try{
      const text = await file.text();
      const json = JSON.parse(text);
      setTextMap(json);
      setCount(Object.keys(json).length);
    }catch(e){ alert("Failed to parse TextMap JSON"); }
  }

  async function autoLoad(){
    setStatus("Loading...");
    for (const url of MIRRORS){
      try{
        const n = await fetchAndSetTextMap(url);
        setCount(n);
        setStatus(`Loaded ${n} entries`);
        return;
      }catch{ /* try next */ }
    }
    setStatus("Failed to auto-load. Upload JSON manually.");
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">TextMap (names)</h3>
          <p className="subtle">Resolve character/weapon/set names. Load automatically or upload an EN TextMap JSON.</p>
          <p className="subtle">Loaded entries: {count}{status ? ` – ${status}` : ""}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={autoLoad} className="px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10">Auto-load</button>
          <button onClick={()=>inputRef.current?.click()} className="px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10">Upload JSON</button>
          <input ref={inputRef} type="file" accept="application/json" className="hidden" onChange={e=>e.target.files && onFile(e.target.files[0])}/>
        </div>
      </div>
    </div>
  );
}
