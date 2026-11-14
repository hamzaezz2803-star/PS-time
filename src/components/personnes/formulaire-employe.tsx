"use client";

import { useActionState, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { creerEmploye } from "@/app/(connecte)/personnel/personnes/actions";
import { Bouton } from "@/components/ui/bouton";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { ChampSelection, type OptionSelection } from "@/components/ui/champ-selection";
import { MessageErreur } from "@/components/ui/message-erreur";
import { ListeOnglets, PanneauOnglet } from "@/components/ui/onglets";
import { LONGUEUR_MAX_MATRICULE, LONGUEUR_MAX_NOM_EMPLOYE } from "@/lib/constantes";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import type { ChampPersonnalise, EtatFormulaireEmploye } from "@/types";
import { ChampsContactEmploi } from "./champs-contact-emploi";
import { ChampsFacultatifs } from "./champs-facultatifs";

const { formulaire: textes } = TEXTES_PERSONNES;
const ETAT_INITIAL: EtatFormulaireEmploye = {};
const obligatoire = (libelle: string) => `${libelle} *`;

type IdOnglet = "contact-emploi" | "champs-personnalises";
const CHAMPS_CONTACT_EMPLOI = ["telephone", "email", "typeEmploi", "dateEmbauche", "dateFinEmploi"];

/** Nombre d'erreurs par onglet facultatif, pour les signaler et ouvrir le bon onglet. */
function compterErreurs(erreurs: EtatFormulaireEmploye["erreursChamps"]) {
  const cles = Object.entries(erreurs ?? {}).filter(([, message]) => message).map(([cle]) => cle);
  return {
    "contact-emploi": cles.filter((cle) => CHAMPS_CONTACT_EMPLOI.includes(cle)).length,
    "champs-personnalises": cles.filter((cle) => cle.startsWith("champ_")).length,
  } satisfies Record<IdOnglet, number>;
}

/**
 * Création d'un employé, sur le modèle CVAccess : l'essentiel en haut, toujours visible,
 * puis les informations facultatives en onglets. Les deux boutons de création se distinguent
 * par `apresCreation` (fermer la fenêtre ou en saisir un autre).
 */
export function FormulaireEmploye({
  departements,
  postes,
  champs,
  onCree,
  onAnnuler,
}: {
  departements: OptionSelection[];
  postes: OptionSelection[];
  champs: ChampPersonnalise[];
  onCree: (message: string, continuer: boolean) => void;
  onAnnuler: () => void;
}) {
  const [onglet, setOnglet] = useState<IdOnglet>("contact-emploi");
  const [etat, action, enCours] = useActionState(
    async (precedent: EtatFormulaireEmploye, formulaire: FormData) => {
      const continuer = formulaire.get("apresCreation") === "continuer";
      const resultat = await creerEmploye(precedent, formulaire);
      if (resultat.succes) {
        setOnglet("contact-emploi");
        onCree(resultat.succes, continuer);
      } else {
        // Ouvre l'onglet facultatif qui contient une erreur (l'essentiel est toujours visible).
        const nombres = compterErreurs(resultat.erreursChamps);
        if (nombres["contact-emploi"] > 0) setOnglet("contact-emploi");
        else if (nombres["champs-personnalises"] > 0) setOnglet("champs-personnalises");
      }
      return resultat;
    },
    ETAT_INITIAL,
  );
  const erreurs = etat.erreursChamps;
  const valeurs = etat.valeurs ?? {};
  const nombresErreurs = compterErreurs(erreurs);

  return (
    <form action={action} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        <fieldset className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <legend className="mb-3 flex w-full items-baseline justify-between gap-4">
            <span className="text-base font-semibold text-marine">{textes.sectionPrincipale}</span>
            <span className="text-sm text-texte-secondaire">* {textes.obligatoire}</span>
          </legend>
          <ChampFormulaire nom="matricule" libelle={obligatoire(textes.matricule)} defaultValue={valeurs.matricule ?? ""} maxLength={LONGUEUR_MAX_MATRICULE} autoComplete="off" spellCheck={false} required autoFocus aide={textes.aideMatricule} erreur={erreurs?.matricule} />
          <ChampSelection nom="departementId" libelle={obligatoire(textes.departement)} options={departements} optionVide={textes.choisirDepartement} defaultValue={valeurs.departementId ?? ""} required erreur={erreurs?.departementId} />
          <ChampFormulaire nom="prenom" libelle={obligatoire(textes.prenom)} defaultValue={valeurs.prenom ?? ""} maxLength={LONGUEUR_MAX_NOM_EMPLOYE} autoComplete="off" required erreur={erreurs?.prenom} />
          <ChampFormulaire nom="nom" libelle={obligatoire(textes.nom)} defaultValue={valeurs.nom ?? ""} maxLength={LONGUEUR_MAX_NOM_EMPLOYE} autoComplete="off" required erreur={erreurs?.nom} />
          <ChampSelection nom="posteId" libelle={textes.poste} options={postes} optionVide={textes.aucunPoste} defaultValue={valeurs.posteId ?? ""} erreur={erreurs?.posteId} />
        </fieldset>

        <div className="mt-7">
          <ListeOnglets
            base="employe"
            libelle={textes.ongletsFacultatifs}
            actif={onglet}
            onChanger={(id) => setOnglet(id as IdOnglet)}
            onglets={[
              { id: "contact-emploi", libelle: textes.ongletContactEmploi, nombreErreurs: nombresErreurs["contact-emploi"], libelleErreurs: textes.erreursOnglet },
              { id: "champs-personnalises", libelle: textes.ongletChampsPersonnalises, nombreErreurs: nombresErreurs["champs-personnalises"], libelleErreurs: textes.erreursOnglet },
            ]}
          />
          <PanneauOnglet base="employe" id="contact-emploi" actif={onglet}>
            <ChampsContactEmploi valeurs={valeurs} erreurs={erreurs} />
          </PanneauOnglet>
          <PanneauOnglet base="employe" id="champs-personnalises" actif={onglet}>
            <ChampsFacultatifs champs={champs} valeurs={valeurs} erreurs={erreurs} />
          </PanneauOnglet>
        </div>
      </div>

      <div className="shrink-0 border-t border-bordure bg-fond px-5 py-3 sm:px-6">
        <div role="alert" aria-live="polite">
          <MessageErreur message={etat.message} className="mb-3 rounded-lg border border-erreur/30 bg-erreur/5 p-3" />
        </div>
        {/* Le bouton principal vient en premier dans le code : c'est lui que déclenche la touche Entrée. */}
        <div className="flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
          <Bouton type="submit" name="apresCreation" value="fermer" disabled={enCours}>
            {enCours && <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            {enCours ? textes.enregistrementEnCours : textes.enregistrer}
          </Bouton>
          <Bouton type="submit" name="apresCreation" value="continuer" variante="contour" disabled={enCours}>
            {textes.creerEtContinuer}
          </Bouton>
          <Bouton variante="fantome" onClick={onAnnuler}>{textes.annuler}</Bouton>
        </div>
      </div>
    </form>
  );
}
