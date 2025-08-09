"use client";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0b1220]/70 backdrop-blur border-b border-black/5 dark:border-white/10">
      <div className="container-pro h-14 flex items-center justify-between">
        <div className="font-semibold">Genshin Analytics</div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
