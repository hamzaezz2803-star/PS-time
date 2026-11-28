"use client";

import { TriangleAlert } from "lucide-react";
import { changerEtatCompteur } from "@/app/(connecte)/presence/compteurs/actions";
import { Interrupteur } from "@/components/ui/interrupteur";
import { Pastille } from "@/components/ui/pastille";
import { TEXTES_COMPTEURS as textes } from "@/lib/textes/compteurs";
import { erreurFormule } from "@/lib/validation/compteur";
import type { Compteur } from "@/types";
import { useCodesEvenements } from "./contexte-codes";

/** Erreur de la formule avec les événements actuels (ex. JOURS_MAL sans événement MAL), ou null. */
export function useErreurFormule(compteur: Compteur): string | null {
  const { codes } = useCodesEvenements();
  return compteur.estAAdapter ? null : erreurFormule(compteur.formule, compteur.periodicites, codes);
}

/** État d'un compteur : interrupteur, ou étiquette tant que sa formule ne peut pas être calculée. */
export function EtatCompteur({ compteur }: { compteur: Compteur }) {
  const erreur = useErreurFormule(compteur);
  if (compteur.estAAdapter) return <Pastille ton="attention" Icone={TriangleAlert}>{textes.standard.aAdapter}</Pastille>;
  // Un compteur actif reste désactivable même si sa formule ne compile plus.
  if (erreur && !compteur.estActif) return <Pastille ton="attention" Icone={TriangleAlert}>{textes.standard.aCompleter}</Pastille>;
  return (
    <Interrupteur
      estActif={compteur.estActif}
      basculer={(nouvelEtat) => changerEtatCompteur(compteur.id, nouvelEtat)}
      libelles={{ actif: textes.actif, inactif: textes.inactif, activer: textes.activer(compteur.nom), desactiver: textes.desactiver(compteur.nom) }}
    />
  );
}
