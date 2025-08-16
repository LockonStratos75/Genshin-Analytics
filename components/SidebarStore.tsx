"use client";

import { createContext, useContext, useState, useCallback } from "react";

type SidebarCtx = {
    open: boolean;
    openDrawer: () => void;
    closeDrawer: () => void;
    toggleDrawer: () => void;
};

const Ctx = createContext<SidebarCtx | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const openDrawer = useCallback(() => setOpen(true), []);
    const closeDrawer = useCallback(() => setOpen(false), []);
    const toggleDrawer = useCallback(() => setOpen((v) => !v), []);
    return (
        <Ctx.Provider value={{ open, openDrawer, closeDrawer, toggleDrawer }}>
            {children}
        </Ctx.Provider>
    );
}

export function useSidebar() {
    const v = useContext(Ctx);
    if (!v) throw new Error("useSidebar must be used within <SidebarProvider>");
    return v;
}
