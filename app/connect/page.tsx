import ImportAccount from "@/components/connect/ImportAccount";
import ImportWishes from "@/components/gacha/ImportWishes";

export const metadata = { title: "Import Data · Genshin Analytics" };

export default function ConnectPage() {
  return (
    <div>
      <h1 className="page-title">Import Data</h1>
      <p className="page-sub">
        Two sources power this site: your Enka.Network showcase (characters, builds) and your wish
        history (pity tracking). Both stay in your browser; nothing is stored on a server.
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ImportAccount />
        <ImportWishes />
      </div>
    </div>
  );
}
