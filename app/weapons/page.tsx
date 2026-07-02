import { getAllWeapons } from "@/lib/gamedata";
import WeaponsBrowser from "@/components/weapons/WeaponsBrowser";

export const metadata = { title: "Weapons · Genshin Analytics" };

export default function WeaponsPage() {
  const weapons = getAllWeapons();
  return (
    <div>
      <h1 className="page-title">Weapons</h1>
      <p className="page-sub">
        All {weapons.length} weapons with max-level stats and refinement 1 passives, plus the ones
        your characters currently hold.
      </p>
      <WeaponsBrowser weapons={weapons} />
    </div>
  );
}
