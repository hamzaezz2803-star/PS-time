"use client";

import { useActionState } from "react";
import type { EtatFormulaire } from "@/types";

type Succes = NonNullable<EtatFormulaire["succes"]>;

/**
 * `numeroReponse` change à chaque réponse : le formulaire est alors recréé avec la dernière
 * saisie (`saisie`), car React vide les champs non contrôlés après l'envoi.
 */
export type EtatFormulaireListe = EtatFormulaire & { numeroReponse: number; saisie?: FormData };

const ETAT_INITIAL: EtatFormulaireListe = { numeroReponse: 0 };

/** État d'un formulaire de liste : appelle `onTermine` dès la réussite et garde la saisie en cas d'erreur. */
export function useFormulaireListe(
  enregistrer: (etat: EtatFormulaire, formulaire: FormData) => Promise<EtatFormulaire>,
  onTermine: (succes: Succes) => void,
) {
  return useActionState(async (precedent: EtatFormulaireListe, formulaire: FormData): Promise<EtatFormulaireListe> => {
    const resultat = await enregistrer(precedent, formulaire);
    if (resultat.succes) onTermine(resultat.succes);
    return { ...resultat, saisie: formulaire, numeroReponse: precedent.numeroReponse + 1 };
  }, ETAT_INITIAL);
}

/** Valeur d'un champ : la dernière saisie si elle existe, sinon la valeur initiale. */
export function valeurSaisie(etat: EtatFormulaireListe, nom: string, initiale: string): string {
  if (!etat.saisie) return initiale;
  const valeur = etat.saisie.get(nom);
  return typeof valeur === "string" ? valeur : "";
}

/** Case à cocher : cochée dans la dernière saisie, sinon valeur initiale. */
export function caseSaisie(etat: EtatFormulaireListe, nom: string, initiale: boolean): boolean {
  return etat.saisie ? etat.saisie.get(nom) === "oui" : initiale;
}
