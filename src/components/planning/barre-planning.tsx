"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { ChoixEmployeUnique } from "@/components/employes/choix-employe-unique";
import type { EmployeChoisissable } from "@/components/employes/choix-employes";
import { BoutonIcone } from "@/components/ui/bouton-icone";
import { VUES_PLANNING } from "@/lib/constantes";
import { formaterMois } from "@/lib/formats";
import type { ElementArbre } from "@/lib/metier/arbre";
import { moisVoisin } from "@/lib/metier/planning-consultation";
import { TEXTES_PLANNING } from "@/lib/textes/planning";
import { cn } from "@/lib/utils";
import { useNavigationPlanning } from "./navigation-planning";

const textes = TEXTES_PLANNING.selection;

/** Mensuel ou Annuel, en boutons à bascule (un seul enfoncé). */
function ChoixVue() {
  const { selection, naviguer } = useNavigationPlanning();
  return (
    <div role="group" aria-label={textes.vue} className="inline-flex rounded-lg border border-bordure-champ bg-fond p-1">
      {VUES_PLANNING.map((vue) => (
        <button
          key={vue}
          type="button"
          aria-pressed={selection.vue === vue}
          onClick={() => naviguer({ vue })}
          className={cn(
            "min-h-9 rounded-md px-4 text-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primaire",
            selection.vue === vue ? "bg-surface text-marine shadow-carte" : "text-texte-secondaire hover:text-marine",
          )}
        >
          {textes.vues[vue]}
        </button>
      ))}
    </div>
  );
}

/** Mois ou année affiché, avec précédent, suivant et retour à la période en cours. */
function ChoixPeriode({ aujourdhui }: { aujourdhui: string }) {
  const { selection, naviguer } = useNavigationPlanning();
  const estMois = selection.vue === "mensuel";
  const moisActuel = aujourdhui.slice(0, 7);
  const anneeActuelle = Number(aujourdhui.slice(0, 4));
  const estActuelle = estMois ? selection.mois === moisActuel : selection.annee === anneeActuelle;
  const decaler = (pas: number) => naviguer(estMois ? { mois: moisVoisin(selection.mois, pas) } : { annee: selection.annee + pas });

  return (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label={textes.periode}>
      <BoutonIcone libelle={textes.precedent[selection.vue]} Icone={ChevronLeft} onClick={() => decaler(-1)} />
      <p className="min-w-40 text-center text-lg font-semibold capitalize text-marine tabular-nums" aria-live="polite">
        {estMois ? formaterMois(selection.mois) : selection.annee}
      </p>
      <BoutonIcone libelle={textes.suivant[selection.vue]} Icone={ChevronRight} onClick={() => decaler(1)} />
      <button
        type="button"
        onClick={() => naviguer(estMois ? { mois: moisActuel } : { annee: anneeActuelle })}
        disabled={estActuelle}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-primaire hover:bg-ciel focus-visible:outline-2 focus-visible:outline-primaire disabled:cursor-not-allowed disabled:opacity-50 lg:min-h-10"
      >
        <CalendarDays className="size-4" aria-hidden="true" />
        {textes.actuelle[selection.vue]}
      </button>
    </div>
  );
}

/** Choix de l'employé, de l'affichage (mensuel ou annuel) et de la période. */
export function BarrePlanning({ employes, departements, aujourdhui }: { employes: EmployeChoisissable[]; departements: ElementArbre[]; aujourdhui: string }) {
  const { selection, naviguer } = useNavigationPlanning();
  return (
    <section aria-label={textes.libelle} className="flex flex-col gap-4 rounded-xl border border-bordure bg-surface p-4 shadow-carte sm:p-5">
      <ChoixEmployeUnique employes={employes} departements={departements} employeId={selection.employe} onChoisir={(employe) => naviguer({ employe })} textes={textes} />
      <div className="flex flex-col gap-3 border-t border-bordure pt-4 sm:flex-row sm:items-center sm:justify-between">
        <ChoixVue />
        <ChoixPeriode aujourdhui={aujourdhui} />
      </div>
    </section>
  );
}
