// path: components/workshop/ResultCard.tsx
import Link from "next/link";

export default function ResultCard({
                                       href,
                                       name,
                                       element,
                                       weapon,
                                       roles,
                                       icon,
                                   }: {
    href: string;
    name: string;
    element: string;
    weapon: string;
    roles: string[];
    icon?: string | null;
}) {
    const badge = (t: string) => (
        <span className="text-xs rounded-lg px-2 py-0.5 border border-black/10 dark:border-white/10">
      {t}
    </span>
    );

    return (
        <Link
            href={href}
            className="flex items-center gap-3 rounded-2xl border border-black/5 dark:border-white/10 p-3 hover:bg-black/5 dark:hover:bg-white/5 transition"
        >
            <img
                src={icon ?? "/favicon.ico"}
                alt={name}
                className="w-12 h-12 rounded-xl object-cover ring-1 ring-black/10 dark:ring-white/10"
            />
            <div className="min-w-0">
                <div className="font-medium">{name}</div>
                <div className="mt-1 flex flex-wrap gap-1 opacity-80">
                    {badge(element)} {badge(weapon)} {roles.map(badge)}
                </div>
            </div>
        </Link>
    );
}
