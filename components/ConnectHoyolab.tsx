"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import useStore from "@/lib/store";

type ApiPayload = {
  player?: { nickname?: string | null; level?: number | null; worldLevel?: number | null };
  characters?: any[];
  weapons?: any[];
  artifacts?: any[];
  warning?: string;
  error?: string;
};

const mapElement = (e?: string) =>
    ({ Fire: "Pyro", Water: "Hydro", Ice: "Cryo", Electric: "Electro", Wind: "Anemo", Rock: "Geo", Grass: "Dendro" } as any)[
    e ?? ""
        ] ?? e;

export default function ConnectHoyolab() {
  const [uid, setUid] = useState("");
  const [status, setStatus] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const setCharacters = useStore((s) => s.setCharacters);
  const setWeapons = useStore((s) => s.setWeapons);
  const setArtifacts = useStore((s) => s.setArtifacts);

  const router = useRouter();

  // Prefill UID from localStorage
  useEffect(() => {
    try {
      const cached = localStorage.getItem("uid");
      if (cached) setUid(cached);
    } catch {
      /* no-op */
    }
  }, []);

  async function fetchViaEnka() {
    setStatus("Fetching…");
    setErr(null);

    try {
      if (!uid) throw new Error("Enter your UID.");
      localStorage.setItem("uid", uid);

      const r = await fetch(`/api/enka/${encodeURIComponent(uid)}`, { cache: "no-store" });
      const j: ApiPayload = await r.json();

      // Debug
      console.log("[/api/enka] status", r.status);
      console.log("[/api/enka] payload", j);

      if (!r.ok || j?.error) throw new Error(j?.error || `HTTP ${r.status}`);

      const rawChars = Array.isArray(j.characters) ? j.characters : [];
      const rawWeps = Array.isArray(j.weapons) ? j.weapons : [];
      const rawArts = Array.isArray(j.artifacts) ? j.artifacts : [];

      // Map elements to GI names (Pyro/Hydro/etc.)
      const characters = rawChars.map((c: any) => ({ ...c, element: mapElement(c?.element) }));

      // Write to Zustand (persisted)
      setCharacters(characters);
      setWeapons(rawWeps);
      setArtifacts(rawArts);

      console.log("[store] set ->", {
        characters: characters.length,
        weapons: rawWeps.length,
        artifacts: rawArts.length,
      });

      if (characters.length === 0) {
        // Surface backend hint if present
        const note =
            j.warning ||
            "Enka returned 0 characters. If your profile is public, this is usually cache — try again in a few minutes.";
        setStatus(note);
        return; // don't navigate; let user retry
      }

      setStatus(`Done ✓ Characters: ${characters.length}, Weapons: ${rawWeps.length}, Artifacts: ${rawArts.length}`);

      // Let persist flush to localStorage before navigation
      await new Promise((res) => setTimeout(res, 0));

      startTransition(() => router.push("/characters"));
    } catch (e: any) {
      console.error("[connect] fetchViaEnka error:", e);
      setErr(e?.message ?? String(e));
      setStatus("Failed.");
    }
  }

  return (
      <div className="card p-4">
        <h2 className="text-lg font-semibold mb-2">Connect</h2>

        <div className="flex gap-2 items-center">
          <input
              className="px-3 py-2 rounded-lg border bg-transparent w-[220px]"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              inputMode="numeric"
              placeholder="UID e.g. 1810459726"
          />
          <button
              onClick={fetchViaEnka}
              disabled={isPending || !uid}
              className="px-3 py-2 rounded-lg border hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-60"
          >
            {isPending ? "Fetching…" : "Fetch via Enka"}
          </button>

          {!!uid && (
              <a
                  href={`https://enka.network/u/${encodeURIComponent(uid)}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs opacity-70 hover:opacity-100 underline ml-2"
                  title="Open your Enka profile to verify data exists"
              >
                Open on Enka
              </a>
          )}
        </div>

        {status && <p className="text-xs opacity-70 mt-2">{status}</p>}
        {err && <p className="text-xs text-red-400 mt-1">Error: {err}</p>}
      </div>
  );
}
