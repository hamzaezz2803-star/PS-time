"use client";

import { ShieldCheck } from "lucide-react";
import { creerUtilisateur, modifierCompte } from "@/app/(connecte)/administration/utilisateurs/actions";
import { ChampMotDePasse } from "@/components/connexion/champ-mot-de-passe";
import type { ProprietesFormulaireListe } from "@/components/liste/gestion-liste";
import { caseSaisie, useFormulaireListe, valeurSaisie } from "@/components/liste/utiliser-formulaire-liste";
import { CaseACocher } from "@/components/ui/case-a-cocher";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { Etiquette } from "@/components/ui/etiquette";
import { MessageErreur } from "@/components/ui/message-erreur";
import { PiedFormulaire } from "@/components/ui/pied-formulaire";
import {
  LONGUEUR_MAX_IDENTIFIANT,
  LONGUEUR_MAX_NOM_UTILISATEUR,
  LONGUEUR_MIN_IDENTIFIANT,
  LONGUEUR_MIN_MOT_DE_PASSE,
} from "@/lib/constantes";
import { nettoyerPages } from "@/lib/metier/droits";
import { lireTexte } from "@/lib/validation/commun";
import { TEXTES_UTILISATEURS } from "@/lib/textes/utilisateurs";
import type { UtilisateurListe } from "@/types";
import { ChoixPages } from "./choix-pages";

const { champs } = TEXTES_UTILISATEURS;

/** Mot de passe (provisoire) et confirmation ; jamais réaffichés après une erreur. */
function ChampsMotDePasse({ libelle, erreurs }: { libelle: string; erreurs?: Partial<Record<string, string>> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[
        { nom: "motDePasse", libelle },
        { nom: "confirmation", libelle: champs.confirmation },
      ].map((champ) => {
        const erreur = erreurs?.[champ.nom];
        return (
          <div key={champ.nom} className="flex flex-col gap-2">
            <Etiquette htmlFor={champ.nom}>{champ.libelle}</Etiquette>
            <ChampMotDePasse
              id={champ.nom}
              name={champ.nom}
              autoComplete="new-password"
              aria-invalid={erreur ? true : undefined}
              aria-describedby={erreur ? `erreur-${champ.nom}` : undefined}
            />
            <MessageErreur id={`erreur-${champ.nom}`} message={erreur} />
          </div>
        );
      })}
    </div>
  );
}

/** Création (sans `element`) d'un administrateur, ou modification d'un compte existant. */
export function FormulaireUtilisateur({ element, onTermine, onAnnuler }: ProprietesFormulaireListe<UtilisateurListe>) {
  const [etat, action, enCours] = useFormulaireListe(element ? modifierCompte : creerUtilisateur, onTermine);
  const erreurs = etat.erreursChamps;
  const pages = etat.saisie ? nettoyerPages(etat.saisie.getAll("pages").map(lireTexte)) : (element?.pages ?? []);

  return (
    <form action={action} noValidate className="flex min-h-0 flex-1 flex-col">
      {element && <input type="hidden" name="id" value={element.id} />}
      <div key={etat.numeroReponse} className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <ChampFormulaire
            nom="nom"
            libelle={champs.nom}
            defaultValue={valeurSaisie(etat, "nom", element?.nomComplet ?? "")}
            placeholder={champs.exempleNom}
            maxLength={LONGUEUR_MAX_NOM_UTILISATEUR}
            autoComplete="off"
            required
            erreur={erreurs?.nom}
            data-focus-initial
          />
          {element ? (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-texte">{champs.identifiant}</span>
              <span className="flex h-11 items-center rounded-lg border border-bordure bg-fond px-3 font-mono text-base text-texte lg:h-10">{element.identifiant}</span>
            </div>
          ) : (
            <ChampFormulaire
              nom="identifiant"
              libelle={champs.identifiant}
              defaultValue={valeurSaisie(etat, "identifiant", "")}
              placeholder={champs.exempleIdentifiant}
              maxLength={LONGUEUR_MAX_IDENTIFIANT}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              required
              erreur={erreurs?.identifiant}
            />
          )}
        </div>

        <ChampsMotDePasse
          libelle={element ? champs.nouveauMotDePasse : champs.motDePasse}
          erreurs={erreurs}
        />

        {element?.estSuperAdmin ? (
          <p className="flex items-start gap-3 rounded-lg border border-primaire/20 bg-ciel p-4 text-base text-marine">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            {champs.superAdmin}
          </p>
        ) : (
          <ChoixPages initiales={pages} erreur={erreurs?.pages} />
        )}

        {element && (
          <div>
            <CaseACocher nom="estActif" libelle={champs.actif} defaultChecked={caseSaisie(etat, "estActif", element.estActif)} />
            <MessageErreur message={erreurs?.estActif} />
          </div>
        )}
      </div>
      <PiedFormulaire
        message={etat.message}
        enCours={enCours}
        libelle={TEXTES_UTILISATEURS.enregistrer}
        libelleEnCours={TEXTES_UTILISATEURS.enregistrementEnCours}
        libelleAnnuler={TEXTES_UTILISATEURS.annuler}
        onAnnuler={onAnnuler}
      />
    </form>
  );
}
