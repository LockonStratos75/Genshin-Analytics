"use client";

import { useEffect, useRef, useState } from "react";
import { Link2, Upload, Download, Trash2, Loader2, Terminal, Copy, Check } from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import useStore from "@/lib/store";
import { computePity } from "@/lib/pity";

export default function ImportWishes() {
  const setWishes = useStore((s) => s.setWishes);
  const setPity = useStore((s) => s.setPity);
  const wishes = useStore((s) => s.wishes);

  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState<"url" | "file" | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      setUrl(localStorage.getItem("wish_url") ?? "");
    } catch {}
  }, []);

  function applyWishes(list: any[]) {
    setWishes(list);
    setPity(computePity(list));
    setMessage({ kind: "ok", text: `Imported ${list.length.toLocaleString()} wishes.` });
  }

  async function fetchFromUrl() {
    if (!url.trim()) return;
    setBusy("url");
    setMessage(null);
    try {
      localStorage.setItem("wish_url", url);
      const res = await fetch("/api/gacha/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error(data?.error || "Unexpected response");
      applyWishes(data);
    } catch (e: any) {
      setMessage({
        kind: "err",
        text: `Could not fetch wishes: ${e?.message ?? "unknown error"}. Authkeys expire after 24h; grab a fresh URL from the in-game history page.`,
      });
    } finally {
      setBusy(null);
    }
  }

  async function handleFile(file: File) {
    setBusy("file");
    setMessage(null);
    const ext = file.name.split(".").pop()?.toLowerCase();
    try {
      let rows: any;
      if (ext === "json") {
        rows = JSON.parse(await file.text());
      } else if (ext === "xlsx") {
        const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
        rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      } else {
        throw new Error("Use a .json (UIGF) or .xlsx export");
      }
      const res = await fetch("/api/wish/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: rows }),
      });
      const parsed = await res.json();
      if (!Array.isArray(parsed)) throw new Error(parsed?.error || "Parse failed");
      applyWishes(parsed);
    } catch (e: any) {
      setMessage({ kind: "err", text: `Import failed: ${e?.message ?? "unknown error"}` });
    } finally {
      setBusy(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function exportCsv() {
    const csv = Papa.unparse(
      (wishes || []).map((w: any) => ({
        time: w.time,
        name: w.name,
        rarity: w.rank_type,
        type: w.item_type,
        banner: w.banner,
      }))
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "wish-history.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function clearAll() {
    setWishes([]);
    setPity({ character: 0, weapon: 0, standard: 0 });
    setMessage({ kind: "ok", text: "Wish history cleared." });
  }

  return (
    <div className="card p-5">
      <h2 className="text-base font-semibold text-white">Import wish history</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-mist-dim">
        Paste your wish history URL below, or upload a UIGF .json / .xlsx export from another
        tracker. On PC the easiest way to get the URL is the PowerShell helper underneath.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://hk4e-api-os.hoyoverse.com/event/gacha_info/api/getGachaLog?..."
          className="input flex-1"
          aria-label="Wish history URL"
        />
        <button onClick={fetchFromUrl} disabled={busy !== null || !url.trim()} className="btn-primary shrink-0">
          {busy === "url" ? (
            <Loader2 size={15} strokeWidth={1.5} className="animate-spin" />
          ) : (
            <Link2 size={15} strokeWidth={1.5} />
          )}
          Fetch from URL
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={() => inputRef.current?.click()} disabled={busy !== null} className="btn-ghost">
          {busy === "file" ? (
            <Loader2 size={15} strokeWidth={1.5} className="animate-spin" />
          ) : (
            <Upload size={15} strokeWidth={1.5} />
          )}
          Upload file
        </button>
        <input
          ref={inputRef}
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          type="file"
          accept=".json,.xlsx"
          className="hidden"
        />
        {wishes?.length > 0 && (
          <>
            <button onClick={exportCsv} className="btn-ghost">
              <Download size={15} strokeWidth={1.5} />
              Export CSV
            </button>
            <button onClick={clearAll} className="btn-ghost text-element-pyro hover:border-element-pyro/40">
              <Trash2 size={15} strokeWidth={1.5} />
              Clear
            </button>
          </>
        )}
      </div>

      {message && (
        <p
          className={`mt-3 text-xs ${
            message.kind === "ok" ? "text-element-anemo" : "text-element-pyro"
          }`}
          role="status"
        >
          {message.text}
        </p>
      )}

      <PowershellHelper />
    </div>
  );
}

function PowershellHelper() {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Download to a file first: executing straight from memory (iex) trips
  // Windows Defender's AMSI heuristics, while the same script runs fine from disk.
  const command = origin
    ? `irm ${origin}/api/wish-script -OutFile $env:TEMP\\ga-wish.ps1; powershell -NoProfile -ExecutionPolicy Bypass -File $env:TEMP\\ga-wish.ps1`
    : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <details className="group mt-4 rounded-lg border border-white/[0.07] bg-ink-950/40">
      <summary className="flex cursor-pointer select-none items-center gap-2 px-4 py-3 text-[13px] font-medium text-mist-dim transition-colors hover:text-mist [&::-webkit-details-marker]:hidden">
        <Terminal size={14} strokeWidth={1.5} className="text-gold-400" />
        Can&apos;t copy the URL? Get it with PowerShell (Windows PC)
      </summary>
      <div className="border-t border-white/[0.06] px-4 py-4">
        <ol className="list-decimal space-y-1.5 pl-4 text-[13px] leading-relaxed text-mist-dim">
          <li>In the game, open Wishes and then History, and let it load once.</li>
          <li>
            Open <span className="text-mist">Windows PowerShell</span> (Start menu, type
            &quot;powershell&quot;).
          </li>
          <li>Paste this command and press Enter:</li>
        </ol>
        <div className="mt-3 flex items-center gap-2">
          <code className="stat-num min-w-0 flex-1 truncate rounded-lg border border-white/10 bg-ink-950 px-3 py-2.5 text-xs text-gold-300">
            {command || "…"}
          </code>
          <button onClick={copy} className="btn-ghost shrink-0" disabled={!command}>
            {copied ? (
              <Check size={14} strokeWidth={2} className="text-element-anemo" />
            ) : (
              <Copy size={14} strokeWidth={1.5} />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-mist-faint">
          The script reads the wish URL from your local game cache, checks it still works, and
          puts it in your clipboard; paste it in the box above. Authkeys expire after 24 hours, so
          reopen the in-game history if it reports the URL is stale.
        </p>
      </div>
    </details>
  );
}
