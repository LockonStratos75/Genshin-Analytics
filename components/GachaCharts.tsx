"use client";
import * as echarts from "echarts";
import { useEffect, useRef } from "react";
import useStore from "@/lib/store";

function Bar({ option }: { option: echarts.EChartsOption }){
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!ref.current) return;
    const chart = echarts.init(ref.current);
    chart.setOption(option);
    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); chart.dispose(); };
  },[option]);
  return <div ref={ref} className="h-72 rounded-xl border border-black/5 dark:border-white/10" />;
}

export default function GachaCharts(){
  const wishes = useStore(s => s.wishes);
  const rarityCount = { "3":0, "4":0, "5":0 } as Record<string, number>;
  wishes.forEach(w => rarityCount[w.rank_type] = (rarityCount[w.rank_type]||0)+1);

  const byMonth = new Map<string, number>();
  wishes.forEach(w => {
    const d = new Date(w.time);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    byMonth.set(key, (byMonth.get(key)||0)+1);
  });
  const months = Array.from(byMonth.keys()).sort();
  const values = months.map(m => byMonth.get(m) || 0);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card p-4">
        <h3 className="font-semibold mb-2">Rarity Distribution</h3>
        <Bar option={{
          xAxis: { type: "category", data: ["3★","4★","5★"] },
          yAxis: { type: "value" },
          series: [{ type: "bar", data: [rarityCount["3"], rarityCount["4"], rarityCount["5"]] }]
        }}/>
      </div>
      <div className="card p-4">
        <h3 className="font-semibold mb-2">Pulls Over Time</h3>
        <Bar option={{
          xAxis: { type: "category", data: months },
          yAxis: { type: "value" },
          series: [{ type: "line", data: values }]
        }}/>
      </div>
    </div>
  );
}
