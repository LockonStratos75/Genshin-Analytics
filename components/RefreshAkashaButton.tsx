// components/RefreshAkashaButton.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function RefreshAkashaButton({ uid }: { uid: string }) {
    const router = useRouter();
    const [ok, setOk] = useState(false);
    const [pending, start] = useTransition();

    const onClick = () =>
        start(async () => {
            setOk(false);
            try {
                const r = await fetch(`/api/akasha/${encodeURIComponent(uid)}`, {
                    method: "POST",
                });
                setOk(r.ok);
            } finally {
                router.refresh(); // re-fetches page data
            }
        });

    return (
        <button
            onClick={onClick}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 px-3 py-1 text-xs bg-white/5 hover:bg-white/10 transition"
        >
            {pending ? "Refreshing…" : "Refresh Akasha"}
            {ok && <span className="text-emerald-500">✓</span>}
        </button>
    );
}
