"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Check } from "lucide-react";

export default function RefreshAkashaButton({ uid }: { uid: string }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();

  const onClick = () =>
    start(async () => {
      setOk(false);
      try {
        const r = await fetch(`/api/akasha/${encodeURIComponent(uid)}`, { method: "POST" });
        setOk(r.ok);
      } finally {
        router.refresh();
      }
    });

  return (
    <button onClick={onClick} disabled={pending} className="chip disabled:opacity-50">
      <RefreshCw size={13} strokeWidth={1.5} className={pending ? "animate-spin" : ""} />
      {pending ? "Refreshing" : "Refresh Akasha"}
      {ok && <Check size={13} strokeWidth={2} className="text-element-anemo" />}
    </button>
  );
}
