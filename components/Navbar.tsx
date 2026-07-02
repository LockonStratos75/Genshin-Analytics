"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, UserCircle2 } from "lucide-react";
import { useSidebar } from "./SidebarStore";

function UidChip() {
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    try {
      setUid(localStorage.getItem("uid"));
    } catch {}
  }, []);

  return (
    <Link
      href="/connect"
      className="chip"
      title={uid ? "Connected UID. Click to manage." : "Connect your account"}
    >
      <UserCircle2 size={14} strokeWidth={1.5} className={uid ? "text-gold-400" : ""} />
      {uid ? <span className="stat-num text-mist">{uid}</span> : "Connect UID"}
    </Link>
  );
}

export default function Navbar() {
  const { toggleDrawer } = useSidebar();

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-ink-950/80 backdrop-blur">
      <div className="container-pro flex h-14 items-center gap-2">
        <button
          aria-label="Open navigation"
          className="lg:hidden rounded-lg p-2 text-mist-dim hover:bg-ink-800 hover:text-mist"
          onClick={toggleDrawer}
        >
          <Menu size={20} strokeWidth={1.5} />
        </button>

        <div className="ml-auto flex items-center gap-2">
          <UidChip />
        </div>
      </div>
    </header>
  );
}
