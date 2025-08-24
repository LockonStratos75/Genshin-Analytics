// path: app/api/workshop/list/route.ts
import 'server-only';
import db from '@/data/workshop-db.json';

type Entry = {
    slug: string;
    name: string;
    element?: string;
    weapon_type?: string;
    ['role(s)']?: string[];
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function iconForCharacter(name: string) {
    // The UI will just <img src={icon}>
    return `/api/workshop/image?q=${encodeURIComponent(`${name} icon genshin impact wiki`)}`;
}

export async function GET(req: Request) {
    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').toLowerCase().trim();
    const element = (url.searchParams.get('element') || '').toLowerCase().trim();
    const weapon = (url.searchParams.get('weapon') || '').toLowerCase().trim();
    const role = (url.searchParams.get('role') || '').toLowerCase().trim();

    let list = (db as Entry[]).map((x) => ({
        slug: x.slug,
        name: x.name,
        element: x.element ?? null,
        weapon_type: x.weapon_type ?? null,
        roles: x['role(s)'] ?? [],
        icon: iconForCharacter(x.name),
    }));

    if (q) list = list.filter((x) => x.name.toLowerCase().includes(q) || x.slug.includes(q));
    if (element) list = list.filter((x) => (x.element || '').toLowerCase() === element);
    if (weapon) list = list.filter((x) => (x.weapon_type || '').toLowerCase() === weapon);
    if (role) list = list.filter((x) => (x.roles || []).some((r) => r.toLowerCase().includes(role)));

    return new Response(JSON.stringify({ items: list }), {
        headers: { 'content-type': 'application/json', 'cache-control': 'public, s-maxage=600, stale-while-revalidate=3600' },
    });
}
