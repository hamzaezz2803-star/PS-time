"use client";

import { enregistrerGroupe } from "@/app/(connecte)/programme/groupes/actions";
import type { ProprietesFormulaireListe } from "@/components/liste/gestion-liste";
import { useFormulaireListe, valeurSaisie } from "@/components/liste/utiliser-formulaire-liste";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { MessageErreur } from "@/components/ui/message-erreur";
import { PiedFormulaire } from "@/components/ui/pied-formulaire";
import { LONGUEUR_MAX_DESCRIPTION_GROUPE, LONGUEUR_MAX_NOM_PROGRAMME } from "@/lib/constantes";
import { lireTexte } from "@/lib/validation/commun";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";
import type { EmployeSelection, Groupe } from "@/types";
import { ChoixMembres } from "./choix-membres";

const textes = TEXTES_PROGRAMME.groupes;

/** Création (sans `element`) ou modification d'un groupe : nom, description et membres. */
export function FormulaireGroupe({
  element,
  employes,
  nomsGroupes,
  onTermine,
  onAnnuler,
}: ProprietesFormulaireListe<Groupe> & { employes: EmployeSelection[]; nomsGroupes: Map<string, string> }) {
  const [etat, action, enCours] = useFormulaireListe(enregistrerGroupe, onTermine);
  const erreurs = etat.erreursChamps;
  const membres = etat.saisie ? etat.saisie.getAll("membres").map(lireTexte) : (element?.membres ?? []);

  return (
    <form action={action} noValidate className="flex min-h-0 flex-1 flex-col">
      {element && <input type="hidden" name="id" value={element.id} />}
      <div key={etat.numeroReponse} className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <ChampFormulaire
            nom="nom"
            libelle={textes.nom}
            defaultValue={valeurSaisie(etat, "nom", element?.nom ?? "")}
            placeholder={textes.exempleNom}
            maxLength={LONGUEUR_MAX_NOM_PROGRAMME}
            autoComplete="off"
            required
            erreur={erreurs?.nom}
            data-focus-initial
          />
          <ChampFormulaire
            nom="description"
            libelle={textes.description}
            defaultValue={valeurSaisie(etat, "description", element?.description ?? "")}
            placeholder={textes.exempleDescription}
            maxLength={LONGUEUR_MAX_DESCRIPTION_GROUPE}
            autoComplete="off"
            erreur={erreurs?.description}
          />
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-base font-semibold text-marine">{textes.membres}</legend>
          <ChoixMembres employes={employes} nomsGroupes={nomsGroupes} idGroupe={element?.id} selectionInitiale={membres} />
          <MessageErreur message={erreurs?.membres} />
        </fieldset>
      </div>
      <PiedFormulaire
        message={etat.message}
        enCours={enCours}
        libelle={textes.enregistrer}
        libelleEnCours={textes.enregistrementEnCours}
        libelleAnnuler={textes.annuler}
        onAnnuler={onAnnuler}
      />
    </form>
  );
}
