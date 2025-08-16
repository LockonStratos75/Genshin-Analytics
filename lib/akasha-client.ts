import "server-only";

// If your installed package is named "akasha.js", change the next line to:
// const mod = await import("akasha.js");
export async function createAkasha() {
    try {
        const mod: any = await import("akasha-system.js");
        const Ctor = mod.default ?? mod.Akasha ?? mod;
        return new Ctor();
    } catch (e: any) {
        // Helpful error if the package isn't installed
        throw new Error(
            `Failed to load 'akasha-system.js'. Make sure it's installed (npm i akasha-system.js). ` +
            `Original error: ${e?.message || e}`
        );
    }
}
