"use client";

import { useActionState } from "react";
import { creerPremierCompte } from "@/app/connexion/actions";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { Etiquette } from "@/components/ui/etiquette";
import { MessageErreur } from "@/components/ui/message-erreur";
import { PiedFormulaire } from "@/components/ui/pied-formulaire";
import { LONGUEUR_MAX_IDENTIFIANT, LONGUEUR_MIN_IDENTIFIANT, LONGUEUR_MIN_MOT_DE_PASSE } from "@/lib/constantes";
import { TEXTES_CONNEXION } from "@/lib/textes/connexion";
import type { EtatPremierCompte } from "@/types";
import { ChampMotDePasse } from "./champ-mot-de-passe";

const textes = TEXTES_CONNEXION.installation;
const ETAT_INITIAL: EtatPremierCompte = {};

const CHAMPS_MOT_DE_PASSE = [
  { nom: "nouveau", libelle: textes.nouveau, aide: textes.aideNouveau(LONGUEUR_MIN_MOT_DE_PASSE) },
  { nom: "confirmation", libelle: textes.confirmation, aide: undefined },
] as const;

/**
 * Fenêtre ouverte après la connexion « pstime » + mot de passe du jour : choix de l'identifiant
 * et du mot de passe du premier administrateur. `jeton` prouve que le code du jour a été accepté.
 */
export function FormulairePremierCompte({
  jeton,
  onCree,
  onAnnuler,
}: {
  jeton: string;
  onCree: (identifiant: string) => void;
  onAnnuler: () => void;
}) {
  const [etat, action, enCours] = useActionState(async (precedent: EtatPremierCompte, formulaire: FormData) => {
    const resultat = await creerPremierCompte(precedent, formulaire);
    if (resultat.identifiantCree) onCree(resultat.identifiantCree);
    return resultat;
  }, ETAT_INITIAL);
  const erreurs = etat.erreursChamps;

  return (
    <form action={action} noValidate className="flex min-h-0 flex-1 flex-col">
      <input type="hidden" name="jeton" value={jeton} />
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 sm:px-6">
        <p className="text-base text-texte-secondaire">{textes.explication}</p>
        <ChampFormulaire
          nom="identifiant"
          libelle={textes.identifiant}
          defaultValue={etat.identifiantSaisi ?? ""}
          placeholder={textes.exempleIdentifiant}
          maxLength={LONGUEUR_MAX_IDENTIFIANT}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          aide={textes.aideIdentifiant(LONGUEUR_MIN_IDENTIFIANT, LONGUEUR_MAX_IDENTIFIANT)}
          erreur={erreurs?.identifiant}
          data-focus-initial
        />
        {CHAMPS_MOT_DE_PASSE.map(({ nom, libelle, aide }) => {
          const erreur = erreurs?.[nom];
          const idAide = aide ? `aide-${nom}` : undefined;
          const idErreur = erreur ? `erreur-${nom}` : undefined;
          return (
            <div key={nom} className="flex flex-col gap-2">
              <Etiquette htmlFor={nom}>{libelle}</Etiquette>
              <ChampMotDePasse
                id={nom}
                name={nom}
                autoComplete="new-password"
                required
                aria-invalid={erreur ? true : undefined}
                aria-describedby={[idAide, idErreur].filter(Boolean).join(" ") || undefined}
              />
              {aide && <p id={idAide} className="text-sm text-texte-secondaire">{aide}</p>}
              <MessageErreur id={idErreur} message={erreur} />
            </div>
          );
        })}
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
