// path: components/workshop/Materials.tsx
"use client";
export default function Materials({
                                      char,
                                      talent,
                                  }: {
    char?: string[];
    talent?: string[];
}) {
    return (
        <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-neutral-900/60 shadow-sm p-4">
                <div className="font-semibold mb-2">Character Ascension</div>
                <ul className="list-disc ml-5 text-sm text-neutral-300">
                    {char?.length ? char.map((m, i) => <li key={i}>{m}</li>) : <li>—</li>}
                </ul>
            </div>
            <div className="rounded-2xl bg-neutral-900/60 shadow-sm p-4">
                <div className="font-semibold mb-2">Talent Materials</div>
                <ul className="list-disc ml-5 text-sm text-neutral-300">
                    {talent?.length ? talent.map((m, i) => <li key={i}>{m}</li>) : <li>—</li>}
                </ul>
            </div>
        </div>
    );
}
