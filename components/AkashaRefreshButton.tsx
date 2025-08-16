"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function RefreshAkasha({ uid }: { uid: string }) {
    const router = useRouter();
    const [pending, start] = useTransition();

    return (
        <button
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs bg-slate-600/10 hover:bg-slate-600/20 dark:text-slate-200 border border-slate-200/20"
            disabled={pending}
            onClick={() =>
                start(async () => {
                    try {
                        await fetch(`/api/akasha/${encodeURIComponent(uid)}?refresh=1`, {
                            cache: "no-store",
                        });
                    } finally {
                        router.refresh(); // revalidate RSC + refresh the page data
                    }
                })
            }
        >
            {pending ? "Refreshing…" : "Refresh Akasha"}
        </button>
    );
}
