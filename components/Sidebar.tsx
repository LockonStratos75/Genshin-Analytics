"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSidebar } from "./SidebarStore";

/* inline icons so we add no deps */
function IconMenu(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" {...props} aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}
function IconX(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" {...props} aria-hidden="true">
            <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

const NAV = [
    { href: "/", label: "Dashboard" },
    { href: "/characters", label: "Characters" },
    { href: "/weapons", label: "Weapons" },
    { href: "/artifacts", label: "Artifacts" },
    { href: "/gacha", label: "Gacha History" },
    { href: "/analytics", label: "Analytics" },
    { href: "/profile", label: "Profile" },
    { href: "/connect", label: "Connect Enka" },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { open, closeDrawer } = useSidebar();

    // Close drawer when route changes
    useEffect(() => {
        closeDrawer();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    return (
        <>
            {/* Desktop sidebar (in layout flow) */}
            <aside className="hidden lg:block w-64 shrink-0">
                <div className="sticky top-0 h-[100dvh] overflow-y-auto border-r border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#0b1220]/60 backdrop-blur p-3">
                    <Brand />
                    <NavList pathname={pathname} />
                </div>
            </aside>

            {/* Mobile drawer (overlay) */}
            <div
                className={`lg:hidden fixed inset-0 z-50 transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                aria-hidden={!open}
            >
                <div className="absolute inset-0 bg-black/40" onClick={closeDrawer} />
                <div
                    className={`absolute left-0 top-0 h-full w-72 max-w-[85%] bg-white dark:bg-[#0b1220] border-r border-black/10 dark:border-white/10 shadow-xl transition-transform ${open ? "translate-x-0" : "-translate-x-full"}`}
                    role="dialog"
                    aria-label="Navigation"
                >
                    <div className="flex items-center justify-between px-3 py-3 border-b border-black/5 dark:border-white/10">
                        <Brand compact />
                        <button aria-label="Close navigation" className="rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/10" onClick={closeDrawer}>
                            <IconX className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-3">
                        <NavList pathname={pathname} onClickItem={closeDrawer} />
                    </div>
                </div>
            </div>
        </>
    );
}

function Brand({ compact = false }: { compact?: boolean }) {
    return (
        <div className="flex items-center gap-2 px-2 pb-2">
            {!compact && <IconMenu className="w-5 h-5 opacity-40" />}
            <div className="font-semibold tracking-tight">Genshin Analytics</div>
        </div>
    );
}

function NavList({
                     pathname,
                     onClickItem,
                 }: {
    pathname: string | null;
    onClickItem?: () => void;
}) {
    return (
        <nav className="mt-1 space-y-1">
            {NAV.map((it) => {
                const active = pathname === it.href || (it.href !== "/" && pathname?.startsWith(it.href));
                return (
                    <Link
                        key={it.href}
                        href={it.href}
                        onClick={onClickItem}
                        className={[
                            "block rounded-xl px-3 py-2 text-sm transition",
                            active
                                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                : "hover:bg-black/5 dark:hover:bg-white/10",
                        ].join(" ")}
                    >
                        {it.label}
                    </Link>
                );
            })}
        </nav>
    );
}
