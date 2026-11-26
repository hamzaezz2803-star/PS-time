"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { ChoixEmployeUnique } from "@/components/employes/choix-employe-unique";
import type { EmployeChoisissable } from "@/components/employes/choix-employes";
import { BoutonIcone } from "@/components/ui/bouton-icone";
import { ChampCalendrier } from "@/components/ui/champ-calendrier";
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
          <ChampCalendrier
            id="choix-date"
            libelle={textes.date}
            value={selection.date}
            aujourdhui={aujourdhui}
            max={aujourdhui}
            required
            onChange={(jour) => jour && jour <= aujourdhui && naviguer({ date: jour })}
            className="min-w-52 flex-1 sm:flex-none"
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
