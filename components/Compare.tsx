"use client";
import useStore from "@/lib/store";
import { useState } from "react";

export default function Compare(){
  const chars = useStore(s => s.characters);
  const [a,setA] = useState<string>("");
  const [b,setB] = useState<string>("");

  const ca = chars.find(c => c.name === a);
  const cb = chars.find(c => c.name === b);

  return (
    <div className="card p-4">
      <div className="flex gap-2 mb-3">
        <select value={a} onChange={e=>setA(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/10 bg-transparent">
          <option value="">Select A</option>
          {chars.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
        <select value={b} onChange={e=>setB(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/10 bg-transparent">
          <option value="">Select B</option>
          {chars.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
      </div>
      {(!ca || !cb) ? <p className="subtle">Choose two characters to compare builds.</p> :
      <div className="grid md:grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl p-3 border border-black/10 dark:border-white/10">
          <div className="font-medium mb-1">{ca.name} (Lv {ca.level})</div>
          <div className="subtle">Weapon: {ca.weapon?.name ?? "—"}</div>
          <div className="subtle">Artifacts: {(ca.artifacts?.length ?? 0)} pieces</div>
          <div className="subtle">Talents: {ca.talents?.join('/') ?? "—"}</div>
        </div>
        <div className="rounded-xl p-3 border border-black/10 dark:border-white/10">
          <div className="font-medium mb-1">{cb.name} (Lv {cb.level})</div>
          <div className="subtle">Weapon: {cb.weapon?.name ?? "—"}</div>
          <div className="subtle">Artifacts: {(cb.artifacts?.length ?? 0)} pieces</div>
          <div className="subtle">Talents: {cb.talents?.join('/') ?? "—"}</div>
        </div>
      </div>}
    </div>
  );
}
