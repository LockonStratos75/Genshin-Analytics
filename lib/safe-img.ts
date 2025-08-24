// path: lib/safe-img.ts
export function safeImgOnError(e: React.SyntheticEvent<HTMLImageElement>, fallback: string) {
    const img = e.currentTarget;
    if (img.dataset.fallenBack === "1") return; // stop loops
    img.dataset.fallenBack = "1";
    img.src = fallback;
    img.onerror = null;
}
