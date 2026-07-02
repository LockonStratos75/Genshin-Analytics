import "./globals.css";
import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { SidebarProvider } from "@/components/SidebarStore";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "Genshin Analytics",
  description:
    "Character builds, leaderboards, weapon and artifact databases, build guides, and wish pity tracking for Genshin Impact.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${outfit.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <body className="min-h-[100dvh] font-sans">
        <SidebarProvider>
          <div className="flex min-h-[100dvh]">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Navbar />
              <main className="container-pro w-full py-6 md:py-8">{children}</main>
            </div>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
