"use client";

import { useMemo, useState } from "react";
import { Building2, UserRound, UsersRound } from "lucide-react";
import { ChampSelection } from "@/components/ui/champ-selection";
import { ChoixCartes, type OptionCarte } from "@/components/ui/choix-cartes";
import { aplatirArbre, construireArbre, idsDescendants, type ElementArbre } from "@/lib/metier/arbre";
import { ChoixEmployes, type EmployeChoisissable, type TextesChoixEmployes } from "./choix-employes";

type Mode = "personne" | "groupe" | "departement";

export type GroupeChoisissable = { id: string; nom: string };

export type TextesChoixCible = TextesChoixEmployes & {
  modeSelection: string;
  modes: Record<Mode, string>;
  groupe: string;
  choisirGroupe: string;
  aucunGroupe: string;
  departement: string;
  choisirDepartement: string;
  employesConcernes: (n: number) => string;
};

/** Nombre de noms affichés sous un groupe ou un département avant « ... ». */
const NOMS_AFFICHES = 12;

/** Employés retenus par un groupe ou un département, envoyés dans des champs cachés (`nomChamp`). */
function EmployesRetenus({ employes, nomChamp, textes }: { employes: EmployeChoisissable[]; nomChamp: string; textes: TextesChoixCible }) {
  const noms = employes.slice(0, NOMS_AFFICHES).map((employe) => employe.nomComplet).join(", ");
  return (
    <div className="rounded-lg border border-bordure bg-fond px-4 py-3 text-sm" aria-live="polite">
      {employes.map((employe) => (
        <input key={employe.id} type="hidden" name={nomChamp} value={employe.id} />
      ))}
      <p className="font-semibold text-marine">{textes.employesConcernes(employes.length)}</p>
      {employes.length > 0 && <p className="mt-1 text-texte-secondaire">{employes.length > NOMS_AFFICHES ? `${noms}...` : noms}</p>}
    </div>
  );
}

/**
 * Choix des employés concernés : une à une (cases à cocher), tout un groupe, ou tout un
 * département (sous-départements compris). Le serveur revérifie chaque employé envoyé.
 */
export function ChoixCibleEmployes({
  employes,
  groupes,
  departements,
  nomChamp,
  selectionInitiale,
  textes,
}: {
  employes: EmployeChoisissable[];
  groupes: GroupeChoisissable[];
  departements: ElementArbre[];
  nomChamp: string;
  selectionInitiale: string[];
  textes: TextesChoixCible;
}) {
  const [mode, setMode] = useState<Mode>("personne");
  const [groupeId, setGroupeId] = useState("");
  const [departementId, setDepartementId] = useState("");
  const options: OptionCarte<Mode>[] = [
    { valeur: "personne", libelle: textes.modes.personne, Icone: UserRound },
    { valeur: "groupe", libelle: textes.modes.groupe, Icone: UsersRound },
    { valeur: "departement", libelle: textes.modes.departement, Icone: Building2 },
  ];
  const optionsDepartements = useMemo(
    () => aplatirArbre(construireArbre(departements)).map((departement) => ({ valeur: departement.id, libelle: " ".repeat(departement.profondeur * 4) + departement.nom })),
    [departements],
  );
  const retenus = useMemo(() => {
    if (mode === "groupe") return groupeId ? employes.filter((employe) => employe.groupeId === groupeId) : [];
    if (mode === "departement" && departementId) {
      const ids = new Set([departementId, ...idsDescendants(departements, departementId)]);
      return employes.filter((employe) => ids.has(employe.departementId));
    }
    return [];
  }, [mode, groupeId, departementId, employes, departements]);

  return (
    <div className="flex flex-col gap-3">
      <ChoixCartes nom={`mode-${nomChamp}`} legende={textes.modeSelection} options={options} valeur={mode} onChanger={setMode} classeGrille="grid-cols-1 sm:grid-cols-3" />
      {mode === "personne" && <ChoixEmployes employes={employes} departements={departements} nomChamp={nomChamp} selectionInitiale={selectionInitiale} textes={textes} />}
      {mode === "groupe" &&
        (groupes.length === 0 ? (
          <p className="rounded-lg border border-bordure bg-fond p-4 text-sm text-texte-secondaire">{textes.aucunGroupe}</p>
        ) : (
          <>
            <ChampSelection nom={`groupe-${nomChamp}`} libelle={textes.groupe} options={groupes.map((groupe) => ({ valeur: groupe.id, libelle: groupe.nom }))} optionVide={textes.choisirGroupe} value={groupeId} onChange={(evenement) => setGroupeId(evenement.target.value)} />
            {groupeId && <EmployesRetenus employes={retenus} nomChamp={nomChamp} textes={textes} />}
          </>
        ))}
      {mode === "departement" && (
        <>
          <ChampSelection nom={`departement-${nomChamp}`} libelle={textes.departement} options={optionsDepartements} optionVide={textes.choisirDepartement} value={departementId} onChange={(evenement) => setDepartementId(evenement.target.value)} />
          {departementId && <EmployesRetenus employes={retenus} nomChamp={nomChamp} textes={textes} />}
        </>
      )}
    </div>
  );
}
