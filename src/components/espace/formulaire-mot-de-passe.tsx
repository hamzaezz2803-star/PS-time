"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { changerMotDePasse } from "@/app/changer-mot-de-passe/actions";
import { ChampMotDePasse } from "@/components/connexion/champ-mot-de-passe";
import { Bouton } from "@/components/ui/bouton";
import { Etiquette } from "@/components/ui/etiquette";
import { MessageErreur } from "@/components/ui/message-erreur";
import { LONGUEUR_MIN_MOT_DE_PASSE } from "@/lib/constantes";
import { TEXTES_MOT_DE_PASSE } from "@/lib/textes/espace";
import type { ChangementMotDePasse, EtatChangementMotDePasse } from "@/types";

const ETAT_INITIAL: EtatChangementMotDePasse = {};
const { champs } = TEXTES_MOT_DE_PASSE;

type ChampConfig = {
  nom: keyof ChangementMotDePasse;
  libelle: string;
  autoComplete: string;
  aide?: string;
};

const CHAMPS: ChampConfig[] = [
  { nom: "actuel", libelle: champs.actuel, autoComplete: "current-password" },
  {
    nom: "nouveau",
    libelle: champs.nouveau,
    autoComplete: "new-password",
    aide: champs.aideNouveau(LONGUEUR_MIN_MOT_DE_PASSE),
  },
  { nom: "confirmation", libelle: champs.confirmation, autoComplete: "new-password" },
];

export function FormulaireMotDePasse() {
  const [etat, action, enCours] = useActionState(changerMotDePasse, ETAT_INITIAL);

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {CHAMPS.map(({ nom, libelle, autoComplete, aide }) => {
        const erreur = etat.erreursChamps?.[nom];
        const idAide = aide ? `aide-${nom}` : undefined;
        const idErreur = erreur ? `erreur-${nom}` : undefined;
        return (
          <div key={nom} className="flex flex-col gap-2">
            <Etiquette htmlFor={nom}>{libelle}</Etiquette>
            <ChampMotDePasse
              id={nom}
              name={nom}
              autoComplete={autoComplete}
              required
              aria-invalid={erreur ? true : undefined}
              aria-describedby={[idAide, idErreur].filter(Boolean).join(" ") || undefined}
            />
            {aide && (
              <p id={idAide} className="text-sm text-texte-secondaire">
                {aide}
              </p>
            )}
            <MessageErreur id={idErreur} message={erreur} />
          </div>
        );
      })}

      <div role="alert" aria-live="polite">
        <MessageErreur
          message={etat.message}
          className="rounded-lg border border-erreur/30 bg-erreur/5 p-3"
        />
      </div>

      <Bouton type="submit" disabled={enCours} className="w-full">
        {enCours && (
          <LoaderCircle
            className="size-5 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
        )}
        {enCours ? TEXTES_MOT_DE_PASSE.boutonEnCours : TEXTES_MOT_DE_PASSE.bouton}
      </Bouton>
    </form>
  );
}
