"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, UserCircle2 } from "lucide-react";
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
  (
    {
      Fire: "Pyro",
      Water: "Hydro",
      Ice: "Cryo",
      Electric: "Electro",
      Wind: "Anemo",
      Rock: "Geo",
      Grass: "Dendro",
    } as any
  )[e ?? ""] ?? e;

export default function ImportAccount() {
  const [uid, setUid] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  const setCharacters = useStore((s) => s.setCharacters);
  const setWeapons = useStore((s) => s.setWeapons);
  const setArtifacts = useStore((s) => s.setArtifacts);

  const router = useRouter();

  useEffect(() => {
    try {
      const cached = localStorage.getItem("uid");
      if (cached) setUid(cached);
    } catch {}
  }, []);

  async function fetchViaEnka() {
    setBusy(true);
    setStatus(null);
    setErr(null);

    try {
      if (!uid) throw new Error("Enter your UID.");
      localStorage.setItem("uid", uid);
      sessionStorage.setItem("enka:uid", uid);

      const r = await fetch(`/api/enka/${encodeURIComponent(uid)}`, { cache: "no-store" });
      const j: ApiPayload = await r.json();
      if (!r.ok || j?.error) throw new Error(j?.error || `HTTP ${r.status}`);

      const rawChars = Array.isArray(j.characters) ? j.characters : [];
      const characters = rawChars.map((c: any) => ({ ...c, element: mapElement(c?.element) }));

      setCharacters(characters);
      setWeapons(Array.isArray(j.weapons) ? j.weapons : []);
      setArtifacts(Array.isArray(j.artifacts) ? j.artifacts : []);

      if (characters.length === 0) {
        setStatus(
          j.warning ||
            "Enka returned 0 characters. If your showcase is public this is usually cache; try again in a few minutes."
        );
        return;
      }

      setStatus(
        `Imported ${characters.length} characters, ${j.weapons?.length ?? 0} weapons, ${
          j.artifacts?.length ?? 0
        } artifacts.`
      );
      await new Promise((res) => setTimeout(res, 0));
      startTransition(() => router.push(`/characters?uid=${encodeURIComponent(uid)}`));
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <UserCircle2 size={17} strokeWidth={1.5} className="text-gold-400" />
        <h2 className="text-base font-semibold text-white">Import your account</h2>
      </div>
      <p className="mt-1 text-[13px] leading-relaxed text-mist-dim">
        Enter your UID and we pull your showcase characters, weapons, and artifacts from
        Enka.Network. Make sure &quot;Show Character Details&quot; is enabled in game.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          className="input sm:max-w-[240px]"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          inputMode="numeric"
          placeholder="UID, e.g. 1810459726"
          aria-label="Your UID"
        />
        <button onClick={fetchViaEnka} disabled={busy || isPending || !uid} className="btn-primary">
          {busy ? <Loader2 size={15} strokeWidth={1.5} className="animate-spin" /> : null}
          {busy ? "Importing" : "Import from Enka"}
        </button>
        {!!uid && (
          <a
            href={`https://enka.network/u/${encodeURIComponent(uid)}/`}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost"
            title="Open your Enka profile to verify data exists"
          >
            <ExternalLink size={14} strokeWidth={1.5} />
            View on Enka
          </a>
        )}
      </div>

      {status && (
        <p className="mt-3 text-xs text-element-anemo" role="status">
          {status}
        </p>
      )}
      {err && (
        <p className="mt-3 text-xs text-element-pyro" role="alert">
          {err}
        </p>
      )}
    </div>
  );
}
