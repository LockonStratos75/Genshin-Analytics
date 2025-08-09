"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/characters", label: "Characters" },
  { href: "/weapons", label: "Weapons" },
  { href: "/artifacts", label: "Artifacts" },
  { href: "/gacha", label: "Gacha History" },
  { href: "/analytics", label: "Analytics" },
  { href: "/profile", label: "Profile" },
  { href: "/connect", label: "Connect HoYoLAB" }
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:block w-60 border-r border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur">
      <nav className="p-3 space-y-1">
        {links.map(l => (
          <Link key={l.href} href={l.href} className={clsx(
            "block rounded-lg px-3 py-2 text-sm hover:bg黒/5 dark:hover:bg白/10".replace("黒","#000").replace("白","#fff"),
            pathname === l.href && "bg-black/5 dark:bg-white/10 font-medium"
          )}>{l.label}</Link>
        ))}
      </nav>
    </aside>
  );
}
