// path: components/workshop/StickyToc.tsx
"use client";

import { useEffect, useState } from "react";

const SECTIONS = [
    "overview",
    "weapons",
    "artifacts",
    "teams",
    "pros-cons",
    "talents",
    "materials",
    "tips",
] as const;

export default function StickyToc() {
    const [active, setActive] = useState<string>("overview");

    useEffect(() => {
        const obs = new IntersectionObserver(
            (entries) => {
                const e = entries
                    .filter((x) => x.isIntersecting)
                    .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
                if (e?.target?.id) setActive(e.target.id);
            },
            { rootMargin: "-40% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
        );
        SECTIONS.forEach((id) => {
            const el = document.getElementById(id);
            if (el) obs.observe(el);
        });
        return () => obs.disconnect();
    }, []);

    return (
        <nav className="sticky top-20 hidden xl:block w-56 shrink-0">
            <div className="rounded-2xl border border-black/5 dark:border-white/10 p-3">
                <div className="text-sm font-semibold mb-2 opacity-80">On this page</div>
                <ul className="space-y-1">
                    {SECTIONS.map((id) => (
                        <li key={id}>
                            <a
                                href={`#${id}`}
                                className={[
                                    "block rounded-lg px-2 py-1 text-sm",
                                    active === id ? "bg-black/5 dark:bg-white/10" : "hover:bg-black/5 dark:hover:bg-white/10",
                                ].join(" ")}
                            >
                                {label(id)}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
}

function label(id: string) {
    return (
        {
            "overview": "Overview",
            "weapons": "Best Weapons",
            "artifacts": "Best Artifacts",
            "teams": "Teams",
            "pros-cons": "Pros & Cons",
            "talents": "Talents & Passives",
            "materials": "Ascension & Materials",
            "tips": "Tips & Rotations",
        } as Record<string, string>
    )[id];
}
