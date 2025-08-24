// path: app/api/workshop/char-icon/route.ts
import 'server-only';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// Exceptions where Aza key isn't just "last word"
const AZA_EXCEPTIONS: Record<string, string> = {
    'Hu Tao': 'Hutao',
    'Yae Miko': 'Yae',
    'Raiden Shogun': 'Shougun',
    'Raiden': 'Shougun',
    'Sara (C6 preferred)': 'Sara',
    'Xingqiu/Yelan': 'Xingqiu',
    'Yelan/Xingqiu': 'Yelan',
    'Baizhu/Yaoyao': 'Baizhuer',
    'Kazuha/Sucrose': 'Kazuha',
    'Zhongli/Healer': 'Zhongli',
};

// Build Aza key: first try exceptions; else last word (TitleCase letters only)
function azaKeyFromName(name: string): string {
    const trimmed = (name || '').replace(/\s+/g, ' ').trim();
    if (!trimmed) return '';
    if (AZA_EXCEPTIONS[trimmed]) return AZA_EXCEPTIONS[trimmed];

    const last = (trimmed.split(' ').pop() || '').replace(/[^a-z]/gi, '');
    return last ? last.charAt(0).toUpperCase() + last.slice(1).toLowerCase() : '';
}

export async function GET(req: NextRequest) {
    const name = req.nextUrl.searchParams.get('name')?.trim() || '';
    if (!name) return new Response('Missing "name"', { status: 400 });

    const key = azaKeyFromName(name);
    const aza = key
        ? `https://ar-cs.aza.gg/g/genshin/UI/UI_AvatarIcon_${key}.webp`
        : '';

    // If Aza URL exists, use it
    if (aza) {
        try {
            const head = await fetch(aza, { method: 'HEAD', cache: 'no-store' });
            if (head.ok) {
                return Response.redirect(aza, 302);
            }
        } catch {
            // ignore
        }
    }

    // Fallback: FastScraper -> wiki image
    const q = encodeURIComponent(`${name} icon genshin impact wiki`);
    return Response.redirect(`/api/workshop/image?q=${q}`, 302);
}
