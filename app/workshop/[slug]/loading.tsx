// path: app/workshop/[slug]/loading.tsx
export default function Loading() {
    return (
        <div className="container-pro py-6">
            <div className="animate-pulse space-y-4">
                <div className="h-7 w-64 bg-black/10 dark:bg-white/10 rounded" />
                <div className="h-40 rounded-2xl bg-black/5 dark:bg-white/5" />
                <div className="h-40 rounded-2xl bg-black/5 dark:bg-white/5" />
                <div className="h-40 rounded-2xl bg-black/5 dark:bg-white/5" />
            </div>
        </div>
    );
}
