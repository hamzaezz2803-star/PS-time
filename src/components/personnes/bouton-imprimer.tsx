"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";

/** Ouvre la fenêtre d'impression (d'où l'on enregistre en PDF), une fois à l'arrivée puis sur demande. */
export function BoutonImprimer() {
  useEffect(() => {
    window.print();
  }, []);

  return (
    <Bouton onClick={() => window.print()}>
      <Printer className="size-5" aria-hidden="true" />
      {TEXTES_PERSONNES.export.imprimer}
    </Bouton>
  );
}
