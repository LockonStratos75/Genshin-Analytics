import "./globals.css";
import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Genshin Analytics",
  description: "Clean, modern Genshin account analytics",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-b from-white to-brand-50/50 dark:from-[#0b1220] dark:to-[#0b1220]">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Navbar />
            <main className="container-pro py-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
