"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";
import { Chargement } from "@/components/ui/chargement";
import { MessageErreur } from "@/components/ui/message-erreur";
import { PiedFenetre } from "@/components/ui/pied-fenetre";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import type { EmployeDetail } from "@/types";
import { FicheEmploye } from "./fiche-employe";

const { details } = TEXTES_PERSONNES;

/** Contenu de la fenêtre « Fiche » : chargement, erreur, ou fiche avec Modifier et Supprimer. */
export function FenetreFiche({
  employe,
  enChargement,
  erreur,
  onModifier,
  onSupprimer,
  onFermer,
}: {
  employe: EmployeDetail | null;
  enChargement: boolean;
  erreur?: string;
  onModifier?: () => void;
  onSupprimer?: () => void;
  onFermer: () => void;
}) {
  return (
    <>
      <div className="min-h-40 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        {erreur ? (
          <MessageErreur message={erreur} className="text-base" />
        ) : employe && !enChargement ? (
          <FicheEmploye employe={employe} />
        ) : (
          <Chargement message={details.chargement} />
        )}
      </div>
      <PiedFenetre>
        {employe && onModifier && (
          <Bouton onClick={onModifier}>
            <Pencil className="size-5" aria-hidden="true" />
            {details.modifier}
          </Bouton>
        )}
        {employe && onSupprimer && (
          <Bouton variante="fantome" onClick={onSupprimer} className="text-erreur hover:bg-erreur/5">
            <Trash2 className="size-5" aria-hidden="true" />
            {details.supprimer}
          </Bouton>
        )}
        <Bouton variante={employe ? "contour" : "principal"} onClick={onFermer} className="sm:me-auto">
          {details.fermer}
        </Bouton>
      </PiedFenetre>
    </>
  );
}
