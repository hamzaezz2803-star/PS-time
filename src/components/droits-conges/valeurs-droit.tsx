"use client";

import { useState, type ReactNode } from "react";
import { Clock, Sun, Sunset } from "lucide-react";
import { valeurSaisie, type EtatFormulaireListe } from "@/components/liste/utiliser-formulaire-liste";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { ChoixCartes, type OptionCarte } from "@/components/ui/choix-cartes";
import { JOURS_DROIT_MAX } from "@/lib/constantes";
import { estValeurValidePourUnite, type UniteDroit } from "@/lib/metier/droits-conges";
import { formaterValeurDroit, TEXTES_DROITS_CONGES as textes } from "@/lib/textes/droits-conges";
import type { ValeursDroit } from "./champs-droit";

const OPTIONS_UNITE: OptionCarte<UniteDroit>[] = [
  { valeur: "journee", libelle: textes.unites.journee, Icone: Sun },
  { valeur: "demi_journee", libelle: textes.unites.demi_journee, Icone: Sunset },
  { valeur: "heures", libelle: textes.unites.heures, Icone: Clock },
];

const COMPLEMENTS = ["joursReliquat", "supplement1", "supplement2", "supplement3"] as const;
type Complement = (typeof COMPLEMENTS)[number];

const lireNombre = (texte: string) => (texte.trim() === "" ? 0 : Number(texte.replace(",", ".")));
const libelleComplement = (champ: Complement) => (champ === "joursReliquat" ? textes.joursReliquat : textes.supplement(Number(champ.slice(-1))));

/**
 * Valeurs chiffrées de la fiche : à gauche le droit et son unité (« Saisie droit »), à droite le
 * reliquat et les trois suppléments, puis le total (reliquat + droit + suppléments) calculé en direct.
 * `reglages` : les choix Oui / Non, placés sous le droit comme sur la fiche.
 */
export function ValeursChiffrees({ etat, initiales, reglages }: { etat: EtatFormulaireListe; initiales: ValeursDroit; reglages: ReactNode }) {
  const erreurs = etat.erreursChamps;
  const [unite, setUnite] = useState<UniteDroit>(() => {
    const saisie = valeurSaisie(etat, "uniteSaisie", initiales.uniteSaisie);
    return saisie === "heures" || saisie === "demi_journee" ? saisie : "journee";
  });
  const [droit, setDroit] = useState(() => valeurSaisie(etat, "joursAcquis", initiales.joursAcquis));
  const [complements, setComplements] = useState<Record<Complement, string>>(() => ({
    joursReliquat: valeurSaisie(etat, "joursReliquat", initiales.joursReliquat),
    supplement1: valeurSaisie(etat, "supplement1", initiales.supplement1),
    supplement2: valeurSaisie(etat, "supplement2", initiales.supplement2),
    supplement3: valeurSaisie(etat, "supplement3", initiales.supplement3),
  }));
  const valeurs = [droit, ...COMPLEMENTS.map((champ) => complements[champ])].map(lireNombre);
  const totalValide = valeurs.every((valeur) => estValeurValidePourUnite(valeur, unite, JOURS_DROIT_MAX));
  const total = valeurs.reduce((somme, valeur) => somme + valeur, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <div className="max-w-xs">
          <ChampFormulaire nom="joursAcquis" libelle={`${textes.joursAcquis} (${textes.unites[unite].toLowerCase()})`} inputMode="decimal" required value={droit} onChange={(evenement) => setDroit(evenement.target.value)} erreur={erreurs?.joursAcquis} autoComplete="off" className="tabular-nums" />
        </div>
        <ChoixCartes nom="uniteSaisie" legende={textes.saisieDroit} options={OPTIONS_UNITE} valeur={unite} onChanger={setUnite} classeGrille="grid-cols-3" />
        {reglages}
      </div>
      <div className="flex flex-col gap-3 lg:border-s lg:border-bordure lg:ps-6">
        {COMPLEMENTS.map((champ) => (
          <ChampFormulaire
            key={champ}
            nom={champ}
            libelle={libelleComplement(champ)}
            inputMode="decimal"
            value={complements[champ]}
            onChange={(evenement) => setComplements((actuels) => ({ ...actuels, [champ]: evenement.target.value }))}
            erreur={erreurs?.[champ]}
            autoComplete="off"
            className="tabular-nums"
          />
        ))}
        <div className="mt-1 rounded-lg border-t-2 border-marine bg-ciel px-4 py-3" aria-live="polite">
          <p className="text-base font-bold text-marine tabular-nums">{totalValide ? textes.totalDisponible(formaterValeurDroit(total, unite)) : `${textes.libelleTotal} : -`}</p>
          <p className="text-sm text-texte-secondaire">{textes.formuleTotal}</p>
        </div>
      </div>
    </div>
  );
}
