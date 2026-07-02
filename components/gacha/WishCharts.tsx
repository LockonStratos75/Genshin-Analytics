"use client";

import * as echarts from "echarts";
import { useEffect, useMemo, useRef } from "react";

const AXIS = { color: "#6b7488", fontFamily: "var(--font-jetbrains)" };
const SPLIT = { lineStyle: { color: "rgba(255,255,255,0.06)" } };

function Chart({ option, className = "h-64" }: { option: echarts.EChartsOption; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chart.setOption(option);
    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
    };
  }, [option]);
  return <div ref={ref} className={className} />;
}

export default function WishCharts({ wishes }: { wishes: any[] }) {
  const { months, threes, fours, fives } = useMemo(() => {
    const byMonth = new Map<string, { 3: number; 4: number; 5: number }>();
    for (const w of wishes || []) {
      const d = new Date(w.time);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const cur = byMonth.get(key) ?? { 3: 0, 4: 0, 5: 0 };
      const r = String(w.rank_type) as "3" | "4" | "5";
      if (r === "3" || r === "4" || r === "5") cur[r]++;
      byMonth.set(key, cur);
    }
    const months = Array.from(byMonth.keys()).sort();
    return {
      months,
      threes: months.map((m) => byMonth.get(m)![3]),
      fours: months.map((m) => byMonth.get(m)![4]),
      fives: months.map((m) => byMonth.get(m)![5]),
    };
  }, [wishes]);

  if (!months.length) return null;

  const option: echarts.EChartsOption = {
    backgroundColor: "transparent",
    tooltip: { trigger: "axis" },
    legend: {
      data: ["3★", "4★", "5★"],
      textStyle: { color: "#a4adc0" },
      top: 0,
    },
    grid: { left: 40, right: 12, top: 32, bottom: 28 },
    xAxis: {
      type: "category",
      data: months,
      axisLabel: AXIS,
      axisLine: { lineStyle: { color: "rgba(255,255,255,0.15)" } },
    },
    yAxis: {
      type: "value",
      axisLabel: AXIS,
      splitLine: SPLIT,
    },
    series: [
      { name: "3★", type: "bar", stack: "total", data: threes, itemStyle: { color: "#3d4b63" } },
      { name: "4★", type: "bar", stack: "total", data: fours, itemStyle: { color: "#b39ce8" } },
      {
        name: "5★",
        type: "bar",
        stack: "total",
        data: fives,
        itemStyle: { color: "#ffb547", borderRadius: [3, 3, 0, 0] },
      },
    ],
  };

  return (
    <div className="card p-5">
      <h3 className="text-base font-semibold text-white">Wishes over time</h3>
      <div className="mt-3">
        <Chart option={option} />
      </div>
    </div>
  );
}
