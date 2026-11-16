"use client";

import { enregistrerSite } from "@/app/(connecte)/personnel/sites/actions";
import type { ProprietesFormulaireListe } from "@/components/liste/gestion-liste";
import { useFormulaireListe, valeurSaisie } from "@/components/liste/utiliser-formulaire-liste";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { PiedFormulaire } from "@/components/ui/pied-formulaire";
import { LONGUEUR_MAX_ADRESSE_SITE, LONGUEUR_MAX_NOM_SITE } from "@/lib/constantes";
import { TEXTES_SITES as textes } from "@/lib/textes/sites";
import type { Site } from "@/types";

/** Création (sans `element`) ou modification d'un site : nom et adresse. */
export function FormulaireSite({ element, onTermine, onAnnuler }: ProprietesFormulaireListe<Site>) {
  const [etat, action, enCours] = useFormulaireListe(enregistrerSite, onTermine);
  const erreurs = etat.erreursChamps;

  return (
    <form action={action} noValidate className="flex min-h-0 flex-1 flex-col">
      {element && <input type="hidden" name="id" value={element.id} />}
      <div key={etat.numeroReponse} className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 sm:px-6">
        <ChampFormulaire
          nom="nom"
          libelle={textes.nom}
          defaultValue={valeurSaisie(etat, "nom", element?.nom ?? "")}
          placeholder={textes.exempleNom}
          maxLength={LONGUEUR_MAX_NOM_SITE}
          autoComplete="off"
          required
          erreur={erreurs?.nom}
          data-focus-initial
        />
        <ChampFormulaire
          nom="adresse"
          libelle={textes.adresse}
          defaultValue={valeurSaisie(etat, "adresse", element?.adresse ?? "")}
          placeholder={textes.exempleAdresse}
          maxLength={LONGUEUR_MAX_ADRESSE_SITE}
          autoComplete="off"
          erreur={erreurs?.adresse}
        />
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
