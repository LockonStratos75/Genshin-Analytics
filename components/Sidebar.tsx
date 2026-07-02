"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSidebar } from "./SidebarStore";
import {
  LayoutDashboard,
  Users,
  Trophy,
  Swords,
  Gem,
  BookOpen,
  Sparkles,
  PlugZap,
  X,
} from "lucide-react";

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-2 py-1">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-gold-500/15 border border-gold-500/30">
        <Sparkles className="h-4.5 w-4.5 text-gold-400" size={18} strokeWidth={1.5} />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="text-[15px] font-semibold text-white">Genshin Analytics</div>
          <div className="text-[11px] text-mist-faint">Teyvat, quantified</div>
        </div>
      )}
    </Link>
  );
}

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/characters", label: "Characters", icon: Users },
  { href: "/leaderboards", label: "Leaderboards", icon: Trophy },
  { href: "/weapons", label: "Weapons", icon: Swords },
  { href: "/artifacts", label: "Artifacts", icon: Gem },
  { href: "/workshop", label: "Build Guides", icon: BookOpen },
  { href: "/gacha", label: "Wish Tracker", icon: Sparkles },
  { href: "/connect", label: "Import Data", icon: PlugZap },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { open, closeDrawer } = useSidebar();

  useEffect(() => {
    closeDrawer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-0 flex h-[100dvh] flex-col overflow-y-auto border-r border-white/[0.07] bg-ink-900/60 px-3 py-4">
          <Brand />
          <NavList pathname={pathname} />
          <div className="mt-auto px-3 pb-1 pt-6 text-[11px] leading-relaxed text-mist-faint">
            Data from Enka.Network, Akasha System, and your own wish history. Not affiliated with
            HoYoverse.
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <div className="absolute inset-0 bg-black/60" onClick={closeDrawer} />
        <div
          className={`absolute left-0 top-0 h-full w-72 border-r border-white/10 bg-ink-900 transition-transform ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
          role="dialog"
          aria-label="Navigation"
        >
          <div className="flex items-center justify-between border-b border-white/[0.07] px-3 py-3">
            <Brand compact />
            <button
              aria-label="Close navigation"
              className="rounded-lg p-2 text-mist-dim hover:bg-ink-800 hover:text-mist"
              onClick={closeDrawer}
            >
              <X size={18} strokeWidth={1.5} />
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

function NavList({ pathname, onClickItem }: { pathname: string | null; onClickItem?: () => void }) {
  return (
    <nav className="mt-6 space-y-0.5">
      {NAV.map((it) => {
        const active = pathname === it.href || (it.href !== "/" && pathname?.startsWith(it.href));
        const Icon = it.icon;
        return (
          <Link
            key={it.href}
            href={it.href}
            onClick={onClickItem}
            className={[
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gold-500/40",
              active
                ? "bg-gold-500/10 text-gold-300 font-medium"
                : "text-mist-dim hover:bg-ink-800 hover:text-mist",
            ].join(" ")}
          >
            <Icon size={17} strokeWidth={1.5} className={active ? "text-gold-400" : ""} />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
