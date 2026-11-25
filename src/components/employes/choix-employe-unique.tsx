"use client";

import { useMemo, useState } from "react";
import type { EmployeChoisissable } from "@/components/employes/choix-employes";
import { ChampRecherche } from "@/components/ui/champ-recherche";
import { Etiquette } from "@/components/ui/etiquette";
import { aplatirArbre, construireArbre, idsDescendants, type ElementArbre } from "@/lib/metier/arbre";
import { correspondARecherche } from "@/lib/metier/recherche";

export const CHAMP_CHOIX = "h-11 w-full rounded-lg border border-bordure-champ bg-surface px-3 text-base text-texte focus-visible:border-primaire focus-visible:outline-2 focus-visible:outline-primaire lg:h-10";

export type TextesChoixEmploye = {
  departement: string;
  tousDepartements: string;
  recherche: string;
  exempleRecherche: string;
  employe: string;
  choisirEmploye: string;
  aucunEmploye: string;
};

/**
 * Choix d'un seul employé en trois champs : département (sous-départements compris), recherche
 * par nom ou matricule, puis la liste filtrée. L'employé choisi reste toujours dans la liste.
 * Partagé par le Détail jour et le Planning.
 */
export function ChoixEmployeUnique({
  employes,
  departements,
  employeId,
  onChoisir,
  textes,
}: {
  employes: EmployeChoisissable[];
  departements: ElementArbre[];
  employeId: string | null;
  onChoisir: (employeId: string | null) => void;
  textes: TextesChoixEmploye;
}) {
  const [departementId, setDepartementId] = useState("");
  const [recherche, setRecherche] = useState("");

  const optionsDepartements = useMemo(() => aplatirArbre(construireArbre(departements)), [departements]);
  const visibles = useMemo(() => {
    const dansDepartement = departementId ? new Set([departementId, ...idsDescendants(departements, departementId)]) : null;
    return employes.filter(
      (employe) =>
        employe.id === employeId ||
        ((!dansDepartement || dansDepartement.has(employe.departementId)) && correspondARecherche(`${employe.nomComplet} ${employe.matricule}`, recherche)),
    );
  }, [employes, departements, departementId, recherche, employeId]);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
      <div className="flex flex-col gap-2">
        <Etiquette htmlFor="filtre-departement">{textes.departement}</Etiquette>
        <select id="filtre-departement" value={departementId} onChange={(e) => setDepartementId(e.target.value)} className={CHAMP_CHOIX}>
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
        <select id="choix-employe" value={employeId ?? ""} onChange={(e) => onChoisir(e.target.value || null)} className={CHAMP_CHOIX}>
          <option value="">{visibles.length === 0 ? textes.aucunEmploye : textes.choisirEmploye}</option>
          {visibles.map((employe) => (
            <option key={employe.id} value={employe.id}>{`${employe.nomComplet} (${employe.matricule})`}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
