// path: app/workshop/page.tsx
import 'server-only';
import WorkshopSearch from '@/components/workshop/WorkshopSearch';

export const dynamic = 'force-dynamic';

export default function Page() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-semibold">Paimon’s Workshop</h1>
            <p className="opacity-80">Search a character to see a concise, ranked build guide. Works offline with your DB.</p>
            <WorkshopSearch />
        </div>
    );
}
