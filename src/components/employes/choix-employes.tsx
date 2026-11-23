"use client";

import { useMemo, useState } from "react";
import { CheckCheck, X } from "lucide-react";
import { ChampRecherche } from "@/components/ui/champ-recherche";
import { Etiquette } from "@/components/ui/etiquette";
import { initiales } from "@/lib/formats";
import { aplatirArbre, construireArbre, idsDescendants, type ElementArbre } from "@/lib/metier/arbre";
import { correspondARecherche } from "@/lib/metier/recherche";
import { cn } from "@/lib/utils";

export type EmployeChoisissable = { id: string; nomComplet: string; matricule: string; departementId: string; groupeId?: string | null };

export type TextesChoixEmployes = {
  rechercher: string;
  exempleRecherche: string;
  selectionnes: (nombre: number) => string;
  aucunEmploye: string;
  aucunResultat: string;
  aide?: string;
  /** Avec `departements` : filtre par département et cases « tout cocher ». */
  filtreDepartement?: string;
  tousDepartements?: string;
  toutCocher?: string;
  toutDecocher?: string;
};

/**
 * Choix d'employés par cases à cocher : recherche (nom ou matricule), filtre par département
 * (sous-départements compris) si `departements` est fourni. Les employés masqués par un filtre
 * restent dans le formulaire, pour que leur choix soit envoyé (champ `nomChamp`).
 */
export function ChoixEmployes({
  employes,
  nomChamp,
  selectionInitiale,
  textes,
  departements,
  detail,
}: {
  employes: EmployeChoisissable[];
  nomChamp: string;
  selectionInitiale: string[];
  textes: TextesChoixEmployes;
  departements?: ElementArbre[];
  /** Ligne secondaire sous le nom (ex. groupe actuel). */
  detail?: (employe: EmployeChoisissable) => string | undefined;
}) {
  const [recherche, setRecherche] = useState("");
  const [departementId, setDepartementId] = useState("");
  const [selection, setSelection] = useState(() => new Set(selectionInitiale));

  const optionsDepartements = useMemo(() => (departements ? aplatirArbre(construireArbre(departements)) : []), [departements]);
  const visibles = useMemo(() => {
    const dansDepartement = departementId && departements ? new Set([departementId, ...idsDescendants(departements, departementId)]) : null;
    return employes.filter(
      (e) => (!dansDepartement || dansDepartement.has(e.departementId)) && correspondARecherche(`${e.nomComplet} ${e.matricule}`, recherche),
    );
  }, [employes, departements, departementId, recherche]);
  const idsVisibles = new Set(visibles.map((e) => e.id));

  const modifier = (ids: string[], coche: boolean) =>
    setSelection((precedente) => {
      const suivante = new Set(precedente);
      ids.forEach((id) => (coche ? suivante.add(id) : suivante.delete(id)));
      return suivante;
    });

  if (employes.length === 0) {
    return <p className="rounded-lg border border-bordure bg-fond p-4 text-sm text-texte-secondaire">{textes.aucunEmploye}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Etiquette htmlFor={`recherche-${nomChamp}`}>{textes.rechercher}</Etiquette>
        <span className="rounded-md bg-ciel px-2 py-0.5 text-sm font-medium tabular-nums text-marine" aria-live="polite">
          {textes.selectionnes(selection.size)}
        </span>
      </div>
      <div className={cn("grid gap-2", departements && "sm:grid-cols-2")}>
        <ChampRecherche id={`recherche-${nomChamp}`} libelle={textes.rechercher} valeur={recherche} onChange={setRecherche} placeholder={textes.exempleRecherche} />
        {departements && (
          <select
            aria-label={textes.filtreDepartement}
            value={departementId}
            onChange={(e) => setDepartementId(e.target.value)}
            className="h-11 w-full rounded-lg border border-bordure-champ bg-surface px-3 text-base text-texte focus-visible:border-primaire focus-visible:outline-2 focus-visible:outline-primaire lg:h-10"
          >
            <option value="">{textes.tousDepartements}</option>
            {optionsDepartements.map((departement) => (
              <option key={departement.id} value={departement.id}>
                {" ".repeat(departement.profondeur * 4) + departement.nom}
              </option>
            ))}
          </select>
        )}
      </div>
      {textes.aide && <p className="text-sm text-texte-secondaire">{textes.aide}</p>}
      {textes.toutCocher && textes.toutDecocher && (
        <div className="flex flex-wrap gap-1">
          <button type="button" onClick={() => modifier([...idsVisibles], true)} disabled={visibles.length === 0} className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-primaire hover:bg-ciel focus-visible:outline-2 focus-visible:outline-primaire disabled:opacity-50 lg:min-h-9">
            <CheckCheck className="size-4" aria-hidden="true" />
            {textes.toutCocher}
          </button>
          <button type="button" onClick={() => setSelection(new Set())} disabled={selection.size === 0} className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-texte-secondaire hover:bg-canevas hover:text-texte focus-visible:outline-2 focus-visible:outline-primaire disabled:opacity-50 lg:min-h-9">
            <X className="size-4" aria-hidden="true" />
            {textes.toutDecocher}
          </button>
        </div>
      )}
      <ul className="max-h-72 divide-y divide-bordure overflow-y-auto rounded-lg border border-bordure bg-surface">
        {employes.map((employe) => {
          const estCoche = selection.has(employe.id);
          const ligneDetail = detail?.(employe);
          return (
            <li key={employe.id} hidden={!idsVisibles.has(employe.id)}>
              <label className={cn("flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2 transition-colors duration-150 hover:bg-fond", estCoche && "bg-ciel/60 hover:bg-ciel")}>
                <input
                  type="checkbox"
                  name={nomChamp}
                  value={employe.id}
                  checked={estCoche}
                  onChange={(e) => modifier([employe.id], e.target.checked)}
                  className="size-5 shrink-0 cursor-pointer accent-primaire focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire"
                />
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-semibold", estCoche ? "bg-primaire text-white" : "bg-canevas text-texte-secondaire")} aria-hidden="true">
                  {initiales(employe.nomComplet)}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-base font-medium text-texte">{employe.nomComplet}</span>
                  {ligneDetail && <span className="truncate text-sm text-texte-secondaire">{ligneDetail}</span>}
                </span>
                <span className="shrink-0 font-mono text-sm tabular-nums text-texte-secondaire">{employe.matricule}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {visibles.length === 0 && <p className="text-sm text-texte-secondaire">{textes.aucunResultat}</p>}
    </div>
  );
}
