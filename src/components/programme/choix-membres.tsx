"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ChampSaisie } from "@/components/ui/champ-saisie";
import { Etiquette } from "@/components/ui/etiquette";
import { TEXTES_PROGRAMME } from "@/lib/textes/programme";
import { cn } from "@/lib/utils";
import type { EmployeSelection } from "@/types";

const textes = TEXTES_PROGRAMME.groupes;

/** Texte comparable : minuscules et sans accents. */
const normaliser = (texte: string) => texte.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/**
 * Choix des membres d'un groupe : recherche par nom ou matricule et cases à cocher.
 * Les employés filtrés restent dans le formulaire (masqués), pour que leur choix soit envoyé.
 */
export function ChoixMembres({
  employes,
  nomsGroupes,
  idGroupe,
  selectionInitiale,
}: {
  employes: EmployeSelection[];
  nomsGroupes: Map<string, string>;
  idGroupe?: string;
  selectionInitiale: string[];
}) {
  const [recherche, setRecherche] = useState("");
  const [selection, setSelection] = useState(() => new Set(selectionInitiale));
  const termes = normaliser(recherche.trim());
  const visibles = useMemo(
    () => new Set(employes.filter((e) => normaliser(`${e.nomComplet} ${e.matricule}`).includes(termes)).map((e) => e.id)),
    [employes, termes],
  );

  const basculer = (id: string, coche: boolean) =>
    setSelection((precedente) => {
      const suivante = new Set(precedente);
      if (coche) suivante.add(id);
      else suivante.delete(id);
      return suivante;
    });

  if (employes.length === 0) {
    return <p className="rounded-lg border border-bordure bg-fond p-4 text-sm text-texte-secondaire">{textes.aucunEmploye}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <Etiquette htmlFor="recherche-membres">{textes.rechercher}</Etiquette>
        <span className="text-sm font-medium text-primaire" aria-live="polite">{textes.selectionnes(selection.size)}</span>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-texte-secondaire" aria-hidden="true" />
        <ChampSaisie
          id="recherche-membres"
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder={textes.exempleRecherche}
          autoComplete="off"
          className="ps-9"
        />
      </div>
      <p className="text-sm text-texte-secondaire">{textes.aideMembres}</p>
      <ul className="max-h-72 divide-y divide-bordure overflow-y-auto rounded-lg border border-bordure">
        {employes.map((employe) => {
          const groupeActuel = employe.groupeId && employe.groupeId !== idGroupe ? nomsGroupes.get(employe.groupeId) : undefined;
          const estCoche = selection.has(employe.id);
          return (
            <li key={employe.id} hidden={!visibles.has(employe.id)}>
              <label className={cn("flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2 hover:bg-fond", estCoche && "bg-ciel/50")}>
                <input
                  type="checkbox"
                  name="membres"
                  value={employe.id}
                  checked={estCoche}
                  onChange={(e) => basculer(employe.id, e.target.checked)}
                  className="size-5 shrink-0 cursor-pointer accent-primaire focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire"
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-base text-texte">{employe.nomComplet}</span>
                  {groupeActuel && <span className="truncate text-sm text-texte-secondaire">{textes.dansGroupe(groupeActuel)}</span>}
                </span>
                <span className="shrink-0 text-sm tabular-nums text-texte-secondaire">{employe.matricule}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {visibles.size === 0 && <p className="text-sm text-texte-secondaire">{textes.aucunResultat}</p>}
    </div>
  );
}
