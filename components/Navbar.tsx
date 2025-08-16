"use client";
import ThemeToggle from "./ThemeToggle";
import { useSidebar } from "./SidebarStore";

function IconMenu(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" {...props} aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export default function Navbar() {
    const { toggleDrawer } = useSidebar();

    return (
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0b1220]/70 backdrop-blur border-b border-black/5 dark:border-white/10">
            <div className="container-pro h-14 flex items-center gap-2">
                {/* Hamburger (hidden on lg where the desktop sidebar is visible) */}
                <button
                    aria-label="Open navigation"
                    className="lg:hidden rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/10"
                    onClick={toggleDrawer}
                >
                    <IconMenu className="w-6 h-6" />
                </button>

                {/*<div className="font-semibold">Genshin Analytics</div>*/}
                <div className="ml-auto flex items-center gap-2">
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
