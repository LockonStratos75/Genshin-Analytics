// path: components/workshop/ProsCons.tsx
"use client";
export default function ProsCons({
                                     pros,
                                     cons,
                                     notes,
                                 }: {
    pros?: string[];
    cons?: string[];
    notes?: string[];
}) {
    return (
        <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-neutral-900/60 shadow-sm p-4">
                <div className="font-semibold mb-2">Pros</div>
                <ul className="list-disc ml-5 text-sm text-neutral-300">
                    {pros?.length ? pros.map((p, i) => <li key={i}>{p}</li>) : <li>—</li>}
                </ul>
            </div>
            <div className="rounded-2xl bg-neutral-900/60 shadow-sm p-4">
                <div className="font-semibold mb-2">Cons</div>
                <ul className="list-disc ml-5 text-sm text-neutral-300">
                    {cons?.length ? cons.map((p, i) => <li key={i}>{p}</li>) : <li>—</li>}
                </ul>
            </div>
            <div className="md:col-span-2 rounded-2xl bg-neutral-900/60 shadow-sm p-4">
                <div className="font-semibold mb-2">Playstyle Notes</div>
                <ul className="list-disc ml-5 text-sm text-neutral-300">
                    {notes?.length ? notes.map((t, i) => <li key={i}>{t}</li>) : <li>—</li>}
                </ul>
            </div>
        </div>
    );
}
