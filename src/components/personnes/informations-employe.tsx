"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Bouton } from "@/components/ui/bouton";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import {
  LIMITE_INFORMATIONS_EMPLOYE,
  LONGUEUR_MAX_LIBELLE_INFORMATION,
  LONGUEUR_MAX_VALEUR_INFORMATION,
} from "@/lib/constantes";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";

const { informations: textes } = TEXTES_PERSONNES;

type Ligne = { cle: number; libelle: string; valeur: string };

/**
 * Onglet « Informations supplémentaires » : lignes « libellé + valeur » propres à l'employé
 * en cours de création, envoyées avec lui (champs informationLibelle et informationValeur).
 */
export function InformationsEmploye({
  initiales,
  erreurs,
}: {
  initiales: { libelle: string; valeur: string }[];
  erreurs?: Record<string, string | undefined>;
}) {
  const [lignes, setLignes] = useState<Ligne[]>(() =>
    initiales.map((information, index) => ({ cle: index, ...information })),
  );
  const [prochaineCle, setProchaineCle] = useState(initiales.length);

  const ajouter = () => {
    setLignes((actuelles) => [...actuelles, { cle: prochaineCle, libelle: "", valeur: "" }]);
    setProchaineCle((cle) => cle + 1);
  };
  const retirer = (cle: number) => setLignes((actuelles) => actuelles.filter((ligne) => ligne.cle !== cle));

  return (
    <div className="flex flex-col gap-4">
      {lignes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-bordure-champ px-4 py-5 text-center text-sm text-texte-secondaire">
          {textes.aucune}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {lignes.map((ligne, index) => (
            // Les erreurs du serveur sont rangées par position de la ligne dans la saisie.
            <li key={ligne.cle} aria-label={textes.ligne(index + 1)} className="grid items-start gap-3 rounded-lg border border-bordure bg-fond p-3 sm:grid-cols-[1fr_1fr_auto]">
              <ChampFormulaire nom={`information_${index}_libelle`} nomEnvoi="informationLibelle" libelle={textes.libelle} defaultValue={ligne.libelle} placeholder={textes.exempleLibelle} maxLength={LONGUEUR_MAX_LIBELLE_INFORMATION} autoComplete="off" erreur={erreurs?.[`information_${index}_libelle`]} />
              <ChampFormulaire nom={`information_${index}_valeur`} nomEnvoi="informationValeur" libelle={textes.valeur} defaultValue={ligne.valeur} placeholder={textes.exempleValeur} maxLength={LONGUEUR_MAX_VALEUR_INFORMATION} autoComplete="off" erreur={erreurs?.[`information_${index}_valeur`]} />
              <button
                type="button"
                onClick={() => retirer(ligne.cle)}
                aria-label={textes.retirer(index + 1)}
                className="flex size-11 items-center justify-center justify-self-end rounded-md text-texte-secondaire transition-colors duration-150 hover:bg-erreur/5 hover:text-erreur focus-visible:outline-2 focus-visible:outline-primaire sm:mt-7 lg:size-10"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Bouton variante="contour" onClick={ajouter} disabled={lignes.length >= LIMITE_INFORMATIONS_EMPLOYE} className="w-full sm:w-fit">
        <Plus className="size-5" aria-hidden="true" />
        {textes.ajouter}
      </Bouton>
    </div>
  );
}
