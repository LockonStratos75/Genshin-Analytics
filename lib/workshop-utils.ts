// path: lib/workshop-utils.ts
export function slugify(name: string) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s'-]/g, "")
        .replace(/['\s]/g, "-")
        .replace(/-+/g, "-");
}

export function debounce<T extends (...args: any[]) => void>(fn: T, ms = 250) {
    let t: any;
    return (...args: Parameters<T>) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}

export type IndexItem = {
    slug: string;
    name: string;
    element: string;
    weapon: string;
    roles: string[];
    icon?: string | null;
};

export type SearchFilters = {
    q: string;
    element: string | "All";
    weapon: string | "All";
    role: string | "All";
};

export function filterIndex(items: IndexItem[], f: SearchFilters): IndexItem[] {
    const q = f.q.trim().toLowerCase();
    return items.filter((it) => {
        const okQ =
            !q ||
            it.name.toLowerCase().includes(q) ||
            it.slug.includes(q) ||
            it.roles.some((r) => r.toLowerCase().includes(q));
        const okE = f.element === "All" || it.element === f.element;
        const okW = f.weapon === "All" || it.weapon === f.weapon;
        const okR = f.role === "All" || it.roles.includes(f.role);
        return okQ && okE && okW && okR;
    });
}
