"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { EmployeChoisissable } from "@/components/employes/choix-employes";
import { BoutonIcone } from "@/components/ui/bouton-icone";
import { ChampRecherche } from "@/components/ui/champ-recherche";
import { Etiquette } from "@/components/ui/etiquette";
import { aplatirArbre, construireArbre, idsDescendants, type ElementArbre } from "@/lib/metier/arbre";
import { ajouterJours } from "@/lib/metier/compteurs/periodes";
import { correspondARecherche } from "@/lib/metier/recherche";
import { TEXTES_DETAIL_JOUR } from "@/lib/textes/detail-jour";
import { useNavigationDetail } from "./navigation-detail";

const textes = TEXTES_DETAIL_JOUR.selection;
const CHAMP = "h-11 w-full rounded-lg border border-bordure-champ bg-surface px-3 text-base text-texte focus-visible:border-primaire focus-visible:outline-2 focus-visible:outline-primaire lg:h-10";

/** Choix de l'employé (filtre par département, recherche) et de la date (veille, lendemain, aujourd'hui). */
export function BarreSelection({ employes, departements, aujourdhui }: { employes: EmployeChoisissable[]; departements: ElementArbre[]; aujourdhui: string }) {
  const { selection, naviguer } = useNavigationDetail();
  const [departementId, setDepartementId] = useState("");
  const [recherche, setRecherche] = useState("");

  const optionsDepartements = useMemo(() => aplatirArbre(construireArbre(departements)), [departements]);
  const visibles = useMemo(() => {
    const dansDepartement = departementId ? new Set([departementId, ...idsDescendants(departements, departementId)]) : null;
    return employes.filter(
      (employe) =>
        employe.id === selection.employe ||
        ((!dansDepartement || dansDepartement.has(employe.departementId)) && correspondARecherche(`${employe.nomComplet} ${employe.matricule}`, recherche)),
    );
  }, [employes, departements, departementId, recherche, selection.employe]);

  const estAujourdhui = selection.date >= aujourdhui;

  return (
    <section aria-label={textes.libelle} className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-xl border border-bordure bg-surface p-4 shadow-carte sm:p-5 xl:grid-cols-[minmax(0,1fr)_auto]">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Etiquette htmlFor="filtre-departement">{textes.departement}</Etiquette>
          <select id="filtre-departement" value={departementId} onChange={(e) => setDepartementId(e.target.value)} className={CHAMP}>
            <option value="">{textes.tousDepartements}</option>
            {optionsDepartements.map((departement) => (
              <option key={departement.id} value={departement.id}>{" ".repeat(departement.profondeur * 4) + departement.nom}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Etiquette htmlFor="recherche-employe">{textes.recherche}</Etiquette>
          <ChampRecherche id="recherche-employe" libelle={textes.recherche} valeur={recherche} onChange={setRecherche} placeholder={textes.exempleRecherche} />
        </div>
        <div className="flex flex-col gap-2">
          <Etiquette htmlFor="choix-employe">{textes.employe}</Etiquette>
          <select id="choix-employe" value={selection.employe ?? ""} onChange={(e) => naviguer({ employe: e.target.value || null })} className={CHAMP}>
            <option value="">{visibles.length === 0 ? textes.aucunEmploye : textes.choisirEmploye}</option>
            {visibles.map((employe) => (
              <option key={employe.id} value={employe.id}>{`${employe.nomComplet} (${employe.matricule})`}</option>
            ))}
          </select>
        </div>
      </div>

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
            className={`${CHAMP} w-auto min-w-38 flex-1 tabular-nums sm:flex-none`}
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
