"use client";

import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { UserPlus } from "lucide-react";
import { lireEmploye } from "@/app/(connecte)/personnel/personnes/actions";
import { Bouton } from "@/components/ui/bouton";
import type { OptionSelection } from "@/components/ui/champ-selection";
import { FenetreModale } from "@/components/ui/fenetre-modale";
import { MessageSucces } from "@/components/ui/message-succes";
import { CHEMIN_DEPARTEMENTS } from "@/lib/constantes";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import type { EmployeDetail } from "@/types";
import { ConfirmationSuppression } from "./confirmation-suppression";
import { ContexteEmployes, type ActionsEmployes, type EmployeVise } from "./contexte-employes";
import { FenetreFiche } from "./fenetre-fiche";
import { FormulaireEmploye } from "./formulaire-employe";

const { formulaire: textes, modification, suppression, details } = TEXTES_PERSONNES;

type Fenetre =
  | { type: "creation" }
  | { type: "fiche" | "modification" | "suppression"; employe: EmployeVise };

/**
 * Gestion des employés, comme dans CVAccess : bouton « Nouvel employé » et fenêtres
 * de fiche, de modification et de suppression ouvertes depuis la liste (passée en `children`).
 */
export function GestionEmployes({
  departements,
  postes,
  sites,
  children,
}: {
  departements: OptionSelection[];
  postes: OptionSelection[];
  sites: OptionSelection[];
  children: ReactNode;
}) {
  const [fenetre, setFenetre] = useState<Fenetre | null>(null);
  const [detail, setDetail] = useState<EmployeDetail | null>(null);
  const [erreurChargement, setErreurChargement] = useState<string>();
  const [enChargement, demarrer] = useTransition();
  // Change à chaque création « et ajouter un autre » : le formulaire repart vide.
  const [numeroSaisie, setNumeroSaisie] = useState(0);
  const [messageSucces, setMessageSucces] = useState<string>();

  const fermer = () => setFenetre(null);

  /** Ouvre une fenêtre ; la fiche et la modification ont besoin de l'employé complet. */
  const ouvrir = (nouvelle: Fenetre) => {
    setMessageSucces(undefined);
    setErreurChargement(undefined);
    setFenetre(nouvelle);
    if (nouvelle.type === "creation") {
      setNumeroSaisie((numero) => numero + 1);
      return;
    }
    if (nouvelle.type === "suppression" || detail?.id === nouvelle.employe.id) return;
    setDetail(null);
    demarrer(async () => {
      const resultat = await lireEmploye(nouvelle.employe.id);
      if (resultat.ok) setDetail(resultat.donnees);
      else setErreurChargement(resultat.erreur);
    });
  };

  const terminer = (message: string, continuer = false) => {
    setMessageSucces(message);
    setDetail(null); // la fiche a pu changer : elle sera relue à la prochaine ouverture
    if (continuer) setNumeroSaisie((numero) => numero + 1);
    else fermer();
  };

  const actions: ActionsEmployes = {
    voir: (employe) => ouvrir({ type: "fiche", employe }),
    modifier: (employe) => ouvrir({ type: "modification", employe }),
    supprimer: (employe) => ouvrir({ type: "suppression", employe }),
  };

  if (departements.length === 0) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-bordure bg-surface shadow-carte p-5 text-base text-texte sm:p-6">
        <p>{textes.aucunDepartement}</p>
        <Link href={CHEMIN_DEPARTEMENTS} className="w-fit font-semibold text-primaire underline underline-offset-4">
          {textes.lienDepartements}
        </Link>
      </div>
    );
  }

  const titres: Record<Fenetre["type"], string> = {
    creation: textes.titre,
    fiche: fenetre && fenetre.type !== "creation" ? details.titre(fenetre.employe.nomComplet) : "",
    modification: fenetre && fenetre.type !== "creation" ? modification.titre(fenetre.employe.nomComplet) : "",
    suppression: suppression.titre,
  };
  const detailCharge = fenetre && fenetre.type !== "creation" && detail?.id === fenetre.employe.id ? detail : null;

  return (
    <ContexteEmployes value={actions}>
      <div className="flex flex-col gap-3">
        <Bouton onClick={() => ouvrir({ type: "creation" })} className="w-full sm:w-fit">
          <UserPlus className="size-5" aria-hidden="true" />
          {textes.ouvrir}
        </Bouton>
        {!fenetre && <MessageSucces message={messageSucces} />}
      </div>
      {children}

      <FenetreModale ouverte={fenetre !== null} onFermer={fermer} titre={fenetre ? titres[fenetre.type] : ""} libelleFermer={details.fermer}>
        {fenetre?.type === "creation" && (
          <>
            {messageSucces && <MessageSucces message={messageSucces} className="mx-5 mt-4 sm:mx-6" />}
            <FormulaireEmploye key={numeroSaisie} departements={departements} postes={postes} sites={sites} onReussite={terminer} onAnnuler={fermer} />
          </>
        )}
        {fenetre?.type === "fiche" && (
          <FenetreFiche
            employe={detailCharge}
            enChargement={enChargement}
            erreur={erreurChargement}
            onModifier={() => ouvrir({ type: "modification", employe: fenetre.employe })}
            onSupprimer={() => ouvrir({ type: "suppression", employe: fenetre.employe })}
            onFermer={fermer}
          />
        )}
        {fenetre?.type === "modification" && (
          detailCharge ? (
            <FormulaireEmploye departements={departements} postes={postes} sites={sites} employe={detailCharge} onReussite={terminer} onAnnuler={fermer} />
          ) : (
            <FenetreFiche employe={null} enChargement={enChargement} erreur={erreurChargement} onFermer={fermer} />
          )
        )}
        {fenetre?.type === "suppression" && (
          <ConfirmationSuppression employe={fenetre.employe} onSupprime={terminer} onAnnuler={fermer} />
        )}
      </FenetreModale>
    </ContexteEmployes>
  );
}
