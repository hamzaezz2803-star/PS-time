import { CircleAlert, CircleCheck, CircleMinus, Lock } from "lucide-react";
import { BoutonModifierSaisie, BoutonSupprimerSaisie } from "@/components/liste/gestion-saisie";
import { AvatarEmploye } from "@/components/personnes/avatar-employe";
import { formaterJour } from "@/lib/formats";
import { anneeCivile, etatSolde, pourcentageConsomme, type EtatSolde } from "@/lib/metier/droits-conges";
import { formaterJours, TEXTES_DROITS_CONGES as textes } from "@/lib/textes/droits-conges";
import { cn } from "@/lib/utils";
import type { DroitCongeListe } from "@/types";

const ETATS: Record<EtatSolde, { couleur: string; Icone: typeof CircleCheck }> = {
  disponible: { couleur: "text-succes", Icone: CircleCheck },
  epuise: { couleur: "text-attention", Icone: CircleMinus },
  depasse: { couleur: "text-erreur", Icone: CircleAlert },
};

/** Nombre sans unité, virgule décimale : « 2,5 ». */
const nombre = (jours: number) => jours.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

function periodeLisible(debut: string, fin: string): string {
  const annee = anneeCivile(debut, fin);
  return annee === null ? textes.periode(formaterJour(debut), formaterJour(fin)) : textes.annee(annee);
}

/** Barre fine : jours pris (plein) puis prévus (clair) sur l'acquis. */
function Barre({ bilan }: { bilan: DroitCongeListe["bilan"] }) {
  const base = Math.max(bilan.acquis, bilan.pris + bilan.prevus, 1);
  const largeur = (jours: number) => `${(jours / base) * 100}%`;
  return (
    <div className="flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full bg-fond ring-1 ring-inset ring-bordure" role="img" aria-label={textes.barre(pourcentageConsomme(bilan))}>
      {bilan.pris > 0 && <span className="h-full rounded-full bg-primaire" style={{ width: largeur(bilan.pris) }} />}
      {bilan.prevus > 0 && <span className="h-full rounded-full bg-accent" style={{ width: largeur(bilan.prevus) }} />}
    </div>
  );
}

/** Pris, prévus et acquis sur une ligne, puis absences décomptées et remarque (repliées). */
function Consommation({ droit }: { droit: DroitCongeListe }) {
  const { bilan } = droit;
  return (
    <div className="flex min-w-0 flex-col gap-1.5 [grid-area:conso]">
      <Barre bilan={bilan} />
      <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm tabular-nums text-texte-secondaire">
        <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-primaire" aria-hidden="true" />{textes.pris} <strong className="font-semibold text-texte">{nombre(bilan.pris)}</strong></span>
        <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-accent" aria-hidden="true" />{textes.prevus} <strong className="font-semibold text-texte">{nombre(bilan.prevus)}</strong></span>
        <span>{textes.acquis} <strong className="font-semibold text-texte">{nombre(bilan.acquis)}</strong>{droit.joursReliquat > 0 && ` (${textes.dontReliquat(nombre(droit.joursReliquat))})`}</span>
      </p>
      {(droit.absences.length > 0 || droit.remarque) && (
        <details className="group text-sm">
          <summary className="w-fit cursor-pointer list-none rounded font-medium text-primaire hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire">
            {droit.absences.length > 0 ? textes.voirAbsences(droit.absences.length) : textes.voirRemarque}
          </summary>
          <ul className="mt-1.5 flex flex-col gap-1 border-s-2 border-bordure ps-3">
            {droit.absences.map((absence) => (
              <li key={absence.id} className="tabular-nums text-texte">
                {textes.absencePeriode(formaterJour(absence.debut), formaterJour(absence.fin))} · <span className="font-medium text-marine">{textes.absenceJours(absence.pris, absence.prevus)}</span>
              </li>
            ))}
            {droit.remarque && <li className="text-texte-secondaire">{droit.remarque}</li>}
            {droit.saisiPar && <li className="text-texte-secondaire">{textes.saisiPar(droit.saisiPar)}</li>}
          </ul>
        </details>
      )}
    </div>
  );
}

/**
 * Un droit sur une ligne : employé, événement et période, consommation, reste, actions.
 * Sur mobile, les mêmes blocs se rangent sur trois lignes (zones de grille).
 */
export function LigneDroit({ droit }: { droit: DroitCongeListe }) {
  const nomComplet = `${droit.prenom} ${droit.nom}`;
  const { bilan } = droit;
  const etat = etatSolde(bilan.soldePrevisionnel);
  const { couleur, Icone } = ETATS[etat];

  return (
    <li className="grid items-center gap-x-4 gap-y-3 px-4 py-3 transition-colors duration-150 [grid-template-areas:'emp_act'_'evt_reste'_'conso_conso'] [grid-template-columns:minmax(0,1fr)_auto] hover:bg-fond sm:px-5 lg:[grid-template-areas:'emp_evt_conso_reste_act'] lg:[grid-template-columns:minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.5fr)_7.5rem_5.5rem]">
      <div className="flex min-w-0 items-center gap-3 [grid-area:emp]">
        <AvatarEmploye id={droit.employeId} nomComplet={nomComplet} photoModifieeLe={droit.photoModifieeLe} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-texte">{nomComplet}</p>
          <p className="truncate text-sm text-texte-secondaire"><span className="font-mono tabular-nums">{droit.matricule}</span> · {droit.departement}</p>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-2.5 [grid-area:evt]">
        <span className="flex h-7 min-w-10 shrink-0 items-center justify-center rounded-md bg-marine px-1.5 font-mono text-sm font-semibold text-white">{droit.evenementCode}</span>
        <div className="min-w-0">
          <p className="truncate font-medium text-texte">{droit.evenementNom}</p>
          <p className="truncate text-sm tabular-nums text-texte-secondaire">{periodeLisible(droit.debut, droit.fin)}</p>
        </div>
      </div>

      <Consommation droit={droit} />

      <div className="flex flex-col items-end gap-0.5 [grid-area:reste] lg:items-start">
        <p className={cn("text-xl font-bold tabular-nums", etat === "depasse" ? "text-erreur" : "text-marine")}>{formaterJours(bilan.soldePrevisionnel)}</p>
        <p className={cn("flex items-center gap-1 text-sm font-medium", couleur)}>
          <Icone className="size-4 shrink-0" aria-hidden="true" />
          {textes.etats[etat]}
          {droit.estBloquant && (
            <span className="ms-1 text-texte-secondaire" title={textes.aideBloquantCarte}>
              <Lock className="size-3.5" aria-hidden="true" />
              <span className="sr-only">{textes.bloquant}</span>
            </span>
          )}
        </p>
      </div>

      <div className="-me-2 flex self-start justify-self-end [grid-area:act] lg:self-center">
        <BoutonModifierSaisie id={droit.id} libelle={textes.modifier(nomComplet)} />
        <BoutonSupprimerSaisie id={droit.id} nom={nomComplet} libelle={textes.supprimer(nomComplet)} />
      </div>
    </li>
  );
}
