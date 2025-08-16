// app/components/AkashaHeader.tsx
"use client";

import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface AkashaHeaderProps {
    uid: number;
}

export default function AkashaHeader({ uid }: AkashaHeaderProps) {
    const { data, error, isLoading } = useSWR(
        `/api/akasha/${uid}`, // this hits your FastAPI bridge
        fetcher,
        { refreshInterval: 60_000 } // refresh every minute
    );

    if (isLoading) return <div className="p-4">Loading Akasha data…</div>;
    if (error) return <div className="p-4 text-red-500">Error fetching Akasha data</div>;

    const calcs = data?.calculations ?? [];
    const best = calcs.sort((a: any, b: any) => (a.topPercent ?? 100) - (b.topPercent ?? 100))[0];

    return (
        <header className="w-full bg-gray-900 text-white px-6 py-4 flex items-center justify-between shadow-lg">
            <div className="flex flex-col">
                <h1 className="text-xl font-bold">UID {uid}</h1>
                <span className="text-sm text-gray-400">Akasha Leaderboards</span>
            </div>

            {best ? (
                <div className="flex items-center space-x-4">
                    <div className="flex flex-col text-right">
                        <span className="text-lg font-semibold">{best.character}</span>
                        <span className="text-sm text-gray-300">
              Top {best.topPercent}% {best.rank && `(#${best.rank})`}
            </span>
                    </div>
                    <Link
                        href={best.url}
                        target="_blank"
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium"
                    >
                        View on Akasha
                    </Link>
                </div>
            ) : (
                <div className="text-sm text-gray-400">No leaderboard data</div>
            )}
        </header>
    );
}
