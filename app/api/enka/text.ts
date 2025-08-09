// app/api/enka/text.ts
export function asText(v: any, lang = "en"): string {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);

    // Enka TextAssets has .get(lang)
    if (typeof v?.get === "function") {
        try { return v.get(lang) ?? ""; } catch { /* ignore */ }
    }

    // fallback common shapes
    if (typeof v?.text === "string") return v.text;
    if (typeof v?.en === "string") return v.en;

    return String(v);
}
