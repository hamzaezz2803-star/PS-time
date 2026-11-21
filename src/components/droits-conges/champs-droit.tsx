"use client";

import { useState } from "react";
import { CalendarRange, Calculator } from "lucide-react";
import { valeurSaisie, caseSaisie, type EtatFormulaireListe } from "@/components/liste/utiliser-formulaire-liste";
import { SectionFormulaire } from "@/components/programme/section-formulaire";
import { CaseACocher } from "@/components/ui/case-a-cocher";
import { ChampFormulaire } from "@/components/ui/champ-formulaire";
import { JOURS_DROIT_MAX, LONGUEUR_MAX_REMARQUE_DROIT } from "@/lib/constantes";
import { estNombreDeJoursValide } from "@/lib/metier/droits-conges";
import { formaterJours, TEXTES_DROITS_CONGES as textes } from "@/lib/textes/droits-conges";

/** Valeurs de départ d'un droit (création : année en cours ; modification : le droit existant). */
export type ValeursDroit = { du: string; au: string; joursAcquis: string; joursReliquat: string; estBloquant: boolean; remarque: string };

const lireJours = (texte: string) => (texte.trim() === "" ? 0 : Number(texte.replace(",", ".")));

/** Raccourci de période : toute une année civile. */
function BoutonAnnee({ annee, onChoisir }: { annee: number; onChoisir: (du: string, au: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChoisir(`${annee}-01-01`, `${annee}-12-31`)}
      className="min-h-11 rounded-lg border border-bordure bg-surface px-3 text-sm font-medium text-marine transition-colors duration-150 hover:border-primaire hover:bg-ciel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire lg:min-h-9"
    >
      {textes.anneeEnCours(annee)}
    </button>
  );
}

/**
 * Période, jours acquis, reliquat, blocage et remarque : communs à la création et à la
 * modification. Recréés à chaque réponse du serveur (clé du formulaire) avec la dernière saisie.
 */
export function ChampsDroit({ etat, initiales, anneeCourante }: { etat: EtatFormulaireListe; initiales: ValeursDroit; anneeCourante: number }) {
  const erreurs = etat.erreursChamps;
  const [du, setDu] = useState(() => valeurSaisie(etat, "du", initiales.du));
  const [au, setAu] = useState(() => valeurSaisie(etat, "au", initiales.au));
  const [acquis, setAcquis] = useState(() => valeurSaisie(etat, "joursAcquis", initiales.joursAcquis));
  const [reliquat, setReliquat] = useState(() => valeurSaisie(etat, "joursReliquat", initiales.joursReliquat));
  const total = lireJours(acquis) + lireJours(reliquat);
  const totalValide = estNombreDeJoursValide(lireJours(acquis), JOURS_DROIT_MAX) && estNombreDeJoursValide(lireJours(reliquat), JOURS_DROIT_MAX);
  const choisirAnnee = (debut: string, fin: string) => {
    setDu(debut);
    setAu(fin);
  };

  return (
    <>
      <SectionFormulaire titre={textes.sectionDroit} icone={CalendarRange}>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={textes.raccourcisPeriode}>
          <span className="text-sm text-texte-secondaire">{textes.raccourcisPeriode} :</span>
          <BoutonAnnee annee={anneeCourante} onChoisir={choisirAnnee} />
          <BoutonAnnee annee={anneeCourante + 1} onChoisir={choisirAnnee} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ChampFormulaire nom="du" libelle={textes.du} type="date" required value={du} onChange={(evenement) => setDu(evenement.target.value)} erreur={erreurs?.du} className="tabular-nums" />
          <ChampFormulaire nom="au" libelle={textes.au} type="date" required value={au} onChange={(evenement) => setAu(evenement.target.value)} erreur={erreurs?.au} className="tabular-nums" />
        </div>
      </SectionFormulaire>

      <SectionFormulaire titre={textes.sectionJours} icone={Calculator}>
        <div className="grid gap-4 sm:grid-cols-2">
          <ChampFormulaire nom="joursAcquis" libelle={textes.joursAcquis} inputMode="decimal" required value={acquis} onChange={(evenement) => setAcquis(evenement.target.value)} aide={textes.aideJoursAcquis} erreur={erreurs?.joursAcquis} autoComplete="off" className="tabular-nums" />
          <ChampFormulaire nom="joursReliquat" libelle={textes.joursReliquat} inputMode="decimal" value={reliquat} onChange={(evenement) => setReliquat(evenement.target.value)} aide={textes.aideReliquat} erreur={erreurs?.joursReliquat} autoComplete="off" className="tabular-nums" />
        </div>
        {totalValide && (
          <p className="rounded-lg bg-ciel px-4 py-3 text-base font-semibold text-marine tabular-nums" aria-live="polite">
            {textes.totalDisponible(formaterJours(total))}
          </p>
        )}
        <CaseACocher nom="estBloquant" libelle={textes.estBloquant} aide={textes.aideBloquant} defaultChecked={caseSaisie(etat, "estBloquant", initiales.estBloquant)} />
        <ChampFormulaire nom="remarque" libelle={textes.remarque} defaultValue={valeurSaisie(etat, "remarque", initiales.remarque)} placeholder={textes.exempleRemarque} maxLength={LONGUEUR_MAX_REMARQUE_DROIT} autoComplete="off" erreur={erreurs?.remarque} />
      </SectionFormulaire>
    </>
  );
}
