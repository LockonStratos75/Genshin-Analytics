// path: app/workshop/loading.tsx
export default function Loading() {
    return (
        <div className="container-pro py-6">
            <div className="animate-pulse rounded-2xl border border-black/5 dark:border-white/10 p-6">
                <div className="h-6 w-48 bg-black/10 dark:bg-white/10 rounded" />
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-20 rounded-xl bg-black/5 dark:bg-white/5" />
                    ))}
                </div>
            </div>
        </div>
    );
}
