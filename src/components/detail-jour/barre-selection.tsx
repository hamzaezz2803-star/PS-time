"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { CHAMP_CHOIX, ChoixEmployeUnique } from "@/components/employes/choix-employe-unique";
import type { EmployeChoisissable } from "@/components/employes/choix-employes";
import { BoutonIcone } from "@/components/ui/bouton-icone";
import { Etiquette } from "@/components/ui/etiquette";
import type { ElementArbre } from "@/lib/metier/arbre";
import { ajouterJours } from "@/lib/metier/compteurs/periodes";
import { TEXTES_DETAIL_JOUR } from "@/lib/textes/detail-jour";
import { useNavigationDetail } from "./navigation-detail";

const textes = TEXTES_DETAIL_JOUR.selection;

/** Choix de l'employé (filtre par département, recherche) et de la date (veille, lendemain, aujourd'hui). */
export function BarreSelection({ employes, departements, aujourdhui }: { employes: EmployeChoisissable[]; departements: ElementArbre[]; aujourdhui: string }) {
  const { selection, naviguer } = useNavigationDetail();
  const estAujourdhui = selection.date >= aujourdhui;

  return (
    <section aria-label={textes.libelle} className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-xl border border-bordure bg-surface p-4 shadow-carte sm:p-5 xl:grid-cols-[minmax(0,1fr)_auto]">
      <ChoixEmployeUnique employes={employes} departements={departements} employeId={selection.employe} onChoisir={(employe) => naviguer({ employe })} textes={textes} />

      <div className="flex flex-col gap-2">
        <Etiquette htmlFor="choix-date">{textes.date}</Etiquette>
        <div className="flex flex-wrap items-center gap-1">
          <BoutonIcone libelle={textes.jourPrecedent} Icone={ChevronLeft} onClick={() => naviguer({ date: ajouterJours(selection.date, -1) })} />
          <input
            id="choix-date"
            type="date"
            value={selection.date}
            max={aujourdhui}
            onChange={(e) => e.target.value && e.target.value <= aujourdhui && naviguer({ date: e.target.value })}
            className={`${CHAMP_CHOIX} w-auto min-w-38 flex-1 tabular-nums sm:flex-none`}
          />
          <BoutonIcone libelle={textes.jourSuivant} Icone={ChevronRight} onClick={() => naviguer({ date: ajouterJours(selection.date, 1) })} disabled={estAujourdhui} />
          <button
            type="button"
            onClick={() => naviguer({ date: aujourdhui })}
            disabled={estAujourdhui}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-primaire hover:bg-ciel focus-visible:outline-2 focus-visible:outline-primaire disabled:cursor-not-allowed disabled:opacity-50 lg:min-h-10"
          >
            <CalendarDays className="size-4" aria-hidden="true" />
            {textes.aujourdhui}
          </button>
        </div>
      </div>
    </section>
  );
}
