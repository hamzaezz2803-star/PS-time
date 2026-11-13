"use client";

import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { LONGUEUR_MAX_VALEUR_CHAMP } from "@/lib/constantes";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import type { ChampPersonnalise } from "@/types";
import { AjoutChamp } from "./ajout-champ";

const { champsFacultatifs: textes } = TEXTES_PERSONNES;

/** Attributs de saisie adaptés au type du champ (une virgule est permise pour les nombres). */
const SAISIE_PAR_TYPE = {
  texte: { type: "text", maxLength: LONGUEUR_MAX_VALEUR_CHAMP },
  nombre: { type: "text", inputMode: "decimal", className: "tabular-nums sm:max-w-48" },
  date: { type: "date", className: "sm:max-w-48" },
} as const;

/** Section « Champs facultatifs » : un champ par définition, puis l'ajout d'une nouvelle définition. */
export function ChampsFacultatifs({
  champs,
  valeurs,
  erreurs,
}: {
  champs: ChampPersonnalise[];
  valeurs: Record<string, string>;
  erreurs?: Record<string, string | undefined>;
}) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="text-base font-semibold text-marine">{textes.titre}</legend>
      <p className="-mt-2 text-sm text-texte-secondaire">{textes.description}</p>
      {champs.length === 0 ? (
        <p className="text-sm text-texte-secondaire">{textes.aucun}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {champs.map((champ) => {
            const nom = `champ_${champ.id}`;
            return (
              <ChampFormulaire
                key={champ.id}
                nom={nom}
                libelle={champ.nom}
                defaultValue={valeurs[nom] ?? ""}
                autoComplete="off"
                erreur={erreurs?.[nom]}
                {...SAISIE_PAR_TYPE[champ.type]}
              />
            );
          })}
        </div>
      )}
      <AjoutChamp />
    </fieldset>
  );
}
