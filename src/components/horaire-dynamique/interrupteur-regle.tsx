"use client";

import { changerEtatRegle } from "@/app/(connecte)/programme/horaire-dynamique/actions";
import { Interrupteur } from "@/components/ui/interrupteur";
import { TEXTES_HORAIRE_DYNAMIQUE as textes } from "@/lib/textes/horaire-dynamique";

/** Interrupteur « active / inactive » d'une règle. */
export function InterrupteurRegle({ id, estActif }: { id: string; estActif: boolean }) {
  return (
    <Interrupteur
      estActif={estActif}
      basculer={(nouvelEtat) => changerEtatRegle(id, nouvelEtat)}
      libelles={{ actif: textes.actif, inactif: textes.inactif, activer: textes.activer, desactiver: textes.desactiver }}
    />
  );
}
