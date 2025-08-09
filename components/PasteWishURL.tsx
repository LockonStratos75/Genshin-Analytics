"use client";
import { useEffect, useState } from "react";
import useStore from "@/lib/store";

export default function PasteWishURL(){
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("");
  const setWishes = useStore(s => s.setWishes);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      setUrl(localStorage.getItem("wish_url") ?? "");
    } catch {}
  }, []);

  async function fetchWishes(){
    setStatus("Fetching wishes...");
    try{
      if (typeof window !== "undefined") localStorage.setItem("wish_url", url);
      const res = await fetch("/api/gacha/fetch", { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify({ url }) });
      const data = await res.json();
      if (Array.isArray(data)) setWishes(data);
      else if (data?.error) throw new Error(data.error);
      setStatus("Done ✓");
    }catch(e:any){
      setStatus("Failed: " + (e?.message ?? ""));
    }
  }

  return (
    <div className="card p-4">
      <h2 className="text-lg font-semibold mb-2">Wish History (Authkey URL)</h2>
      <p className="text-sm opacity-70 mb-2">Open Wish → History in-game (PC), copy the long URL and paste here.</p>
      <div className="flex gap-2 items-center">
        <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://hk4e-api-os.hoyoverse.com/event/gacha_info/api/getGachaLog?...authkey=..." className="flex-1 px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/10 bg-transparent"/>
        <button onClick={fetchWishes} className="px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10">Fetch</button>
      </div>
      {status && <p className="text-xs opacity-70 mt-2">{status}</p>}
    </div>
  );
}
