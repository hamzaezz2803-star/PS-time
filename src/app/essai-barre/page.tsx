import { BarreNavigation } from "@/components/tableau-de-bord/barre-navigation";
import { CadreTableauDeBord } from "@/components/tableau-de-bord/cadre-tableau-de-bord";

export default function PageEssai() {
  return (
    <CadreTableauDeBord
      navigation={<BarreNavigation droits={{ estSuperAdmin: true, pages: [] }} />}
      compte={<div id="compte-essai" className="flex h-11 w-44 shrink-0 items-center gap-2 rounded-lg bg-canevas px-2 text-sm">lhaj</div>}
    >
      essai
    </CadreTableauDeBord>
  );
}
