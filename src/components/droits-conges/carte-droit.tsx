import { ChevronDown, CircleAlert, CircleCheck, CircleMinus, Lock } from "lucide-react";
import { BoutonModifierSaisie, BoutonSupprimerSaisie } from "@/components/liste/gestion-saisie";
import { AvatarEmploye } from "@/components/personnes/avatar-employe";
import { Pastille } from "@/components/ui/pastille";
import { formaterJour } from "@/lib/formats";
import { etatSolde, pourcentageConsomme, type EtatSolde } from "@/lib/metier/droits-conges";
import { formaterJours, TEXTES_DROITS_CONGES as textes } from "@/lib/textes/droits-conges";
import { cn } from "@/lib/utils";
import type { DroitCongeListe } from "@/types";

const PASTILLES: Record<EtatSolde, { ton: "succes" | "attention" | "erreur"; Icone: typeof CircleCheck }> = {
  disponible: { ton: "succes", Icone: CircleCheck },
  epuise: { ton: "attention", Icone: CircleMinus },
  depasse: { ton: "erreur", Icone: CircleAlert },
};

/** Barre de consommation : jours pris (plein), jours prévus (clair), reste (vide). */
function BarreConsommation({ bilan }: { bilan: DroitCongeListe["bilan"] }) {
  const base = Math.max(bilan.acquis, bilan.pris + bilan.prevus, 1);
  const largeur = (jours: number) => `${(jours / base) * 100}%`;
  return (
    <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-fond ring-1 ring-inset ring-bordure" role="img" aria-label={textes.barre(pourcentageConsomme(bilan))}>
      {bilan.pris > 0 && <span className="h-full rounded-full bg-primaire" style={{ width: largeur(bilan.pris) }} />}
      {bilan.prevus > 0 && <span className="h-full rounded-full bg-accent" style={{ width: largeur(bilan.prevus) }} />}
    </div>
  );
}

/** Un chiffre du bilan : libellé, valeur et pastille de couleur de la légende (facultative). */
function Chiffre({ libelle, jours, couleur, estNegatif = false }: { libelle: string; jours: number; couleur?: string; estNegatif?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="flex items-center gap-1.5 text-sm text-texte-secondaire">
        {couleur && <span className={cn("size-2.5 rounded-full", couleur)} aria-hidden="true" />}
        {libelle}
      </dt>
      <dd className={cn("text-base font-semibold tabular-nums", estNegatif ? "text-erreur" : "text-texte")}>{formaterJours(jours)}</dd>
    </div>
  );
}

/** Absences décomptées, repliées par défaut (sans JavaScript). */
function AbsencesDecomptees({ absences }: { absences: DroitCongeListe["absences"] }) {
  if (absences.length === 0) return <p className="text-sm text-texte-secondaire">{textes.voirAbsences(0)}</p>;
  return (
    <details className="group">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-md text-sm font-medium text-primaire hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire lg:min-h-8">
        <ChevronDown className="size-4 transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
        {textes.voirAbsences(absences.length)}
      </summary>
      <ul className="mt-2 divide-y divide-bordure rounded-lg border border-bordure">
        {absences.map((absence) => (
          <li key={absence.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-3 py-2 text-sm">
            <span className="tabular-nums text-texte">{textes.absencePeriode(formaterJour(absence.debut), formaterJour(absence.fin))}</span>
            <span className="font-medium tabular-nums text-marine">{textes.absenceJours(absence.pris, absence.prevus)}</span>
            {absence.remarque && <span className="w-full text-texte-secondaire">{absence.remarque}</span>}
          </li>
        ))}
      </ul>
    </details>
  );
}

/** Carte d'un droit aux congés : employé, événement, période, reste en grand, barre et détail. */
export function CarteDroit({ droit }: { droit: DroitCongeListe }) {
  const nomComplet = `${droit.prenom} ${droit.nom}`;
  const { bilan } = droit;
  const etat = etatSolde(bilan.soldePrevisionnel);
  const pastille = PASTILLES[etat];

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-bordure bg-surface p-4 shadow-carte transition-shadow duration-150 hover:shadow-survol sm:p-5" aria-label={`${nomComplet}, ${droit.evenementNom}`}>
      <header className="flex items-start gap-3">
        <AvatarEmploye id={droit.employeId} nomComplet={nomComplet} photoModifieeLe={droit.photoModifieeLe} />
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="truncate text-base font-semibold text-texte">{nomComplet}</h3>
          <p className="truncate text-sm text-texte-secondaire">
            <span className="font-mono tabular-nums">{droit.matricule}</span> · {droit.departement}
          </p>
        </div>
        <div className="-me-2 -mt-1 flex shrink-0">
          <BoutonModifierSaisie id={droit.id} libelle={textes.modifier(nomComplet)} />
          <BoutonSupprimerSaisie id={droit.id} nom={nomComplet} libelle={textes.supprimer(nomComplet)} />
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-7 min-w-10 items-center justify-center rounded-md bg-marine px-2 font-mono text-sm font-semibold text-white">{droit.evenementCode}</span>
        <span className="font-medium text-texte">{droit.evenementNom}</span>
        <span className="text-sm tabular-nums text-texte-secondaire">{textes.periode(formaterJour(droit.debut), formaterJour(droit.fin))}</span>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-2">
        <p className="flex items-baseline gap-2">
          <span className={cn("text-3xl font-bold tabular-nums", etat === "depasse" ? "text-erreur" : "text-marine")}>{formaterJours(bilan.soldePrevisionnel)}</span>
          <span className="text-sm text-texte-secondaire">{textes.restants(bilan.soldePrevisionnel)}</span>
        </p>
        <span className="flex flex-wrap gap-1.5">
          <Pastille ton={pastille.ton} Icone={pastille.Icone}>{textes.etats[etat]}</Pastille>
          {droit.estBloquant && <span title={textes.aideBloquantCarte}><Pastille ton="neutre" Icone={Lock}>{textes.bloquant}</Pastille></span>}
        </span>
      </div>

      <BarreConsommation bilan={bilan} />
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Chiffre libelle={textes.acquis} jours={bilan.acquis} />
        <Chiffre libelle={textes.pris} jours={bilan.pris} couleur="bg-primaire" />
        <Chiffre libelle={textes.prevus} jours={bilan.prevus} couleur="bg-accent" />
        <Chiffre libelle={textes.reste} jours={bilan.soldePrevisionnel} couleur="bg-fond ring-1 ring-bordure" estNegatif={bilan.soldePrevisionnel < 0} />
      </dl>
      <p className="text-sm text-texte-secondaire">
        {droit.joursReliquat > 0 && <>{textes.detailAcquis(formaterJours(droit.joursAcquis), formaterJours(droit.joursReliquat))} · </>}
        {textes.aujourdhui(bilan.soldeAujourdhui)}
      </p>

      <AbsencesDecomptees absences={droit.absences} />
      {(droit.remarque || droit.saisiPar) && (
        <footer className="border-t border-bordure pt-3 text-sm text-texte-secondaire">
          {droit.remarque}
          {droit.remarque && droit.saisiPar && " · "}
          {droit.saisiPar && textes.saisiPar(droit.saisiPar)}
        </footer>
      )}
    </article>
  );
}
