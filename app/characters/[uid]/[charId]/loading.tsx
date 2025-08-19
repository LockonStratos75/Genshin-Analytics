// app/characters/[uid]/[charId]/loading.tsx
export default function Loading() {
    return (
        <div className="card p-5 animate-pulse space-y-4">
            <div className="h-6 w-40 rounded bg-black/10 dark:bg-white/10" />
            <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-black/10 dark:bg-white/10" />
                <div className="space-y-2">
                    <div className="h-5 w-48 rounded bg-black/10 dark:bg-white/10" />
                    <div className="h-4 w-32 rounded bg-black/10 dark:bg-white/10" />
                </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-black/5 dark:bg-white/5" />
                ))}
            </div>
        </div>
    );
}
