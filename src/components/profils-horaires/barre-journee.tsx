import { minutesVersHeure, MINUTES_PAR_JOUR } from "@/lib/metier/programme";
import { TYPES_PLAGE, type Plage, type TypePlage } from "@/lib/metier/profil-horaire";
import { TEXTES_PROFILS } from "@/lib/textes/profils-horaires";
import { cn } from "@/lib/utils";

/** Couleur de chaque type de plage (le libellé est toujours donné à côté : légende, info-bulle). */
export const COULEURS_PLAGE: Record<TypePlage, string> = {
  fixe: "bg-primaire",
  variable: "bg-accent/45",
  repas: "bg-attention/45",
  retard_tolere: "bg-attention/20",
  neutralisee: "bg-canevas",
  interdite: "bg-erreur/15",
};

const REPERES = [0, 6, 12, 18, 24];
const libelle = (type: TypePlage) => TEXTES_PROFILS.typesPlage[type].libelle;

/** Journée de 00:00 à 24:00 : une bande par plage, proportionnelle à sa durée. */
export function BarreJournee({ plages, avecReperes = false, className }: { plages: Plage[]; avecReperes?: boolean; className?: string }) {
  return (
    <div className={cn("flex w-full flex-col gap-1", className)}>
      <div className="flex h-4 w-full overflow-hidden rounded-md ring-1 ring-inset ring-bordure" role="img" aria-label={plages.map((p) => `${minutesVersHeure(p.debut)}-${minutesVersHeure(p.fin)} ${libelle(p.type)}`).join(", ")}>
        {plages.map((plage) => (
          <span
            key={plage.debut}
            title={`${minutesVersHeure(plage.debut)} – ${minutesVersHeure(plage.fin)} · ${libelle(plage.type)}`}
            className={cn("h-full border-e border-surface last:border-e-0", COULEURS_PLAGE[plage.type])}
            style={{ width: `${((plage.fin - plage.debut) / MINUTES_PAR_JOUR) * 100}%` }}
          />
        ))}
      </div>
      {avecReperes && (
        <div className="flex justify-between text-xs tabular-nums text-texte-secondaire" aria-hidden="true">
          {REPERES.map((heure) => (
            <span key={heure}>{String(heure).padStart(2, "0")}h</span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Légende des types de plage. */
export function LegendePlages() {
  return (
    <ul className="grid gap-2 text-sm text-texte sm:grid-cols-2">
      {TYPES_PLAGE.map((type) => (
        <li key={type} className="flex items-start gap-2">
          <span className={cn("mt-0.5 size-4 shrink-0 rounded ring-1 ring-inset ring-bordure", COULEURS_PLAGE[type])} aria-hidden="true" />
          <span className="font-medium">{libelle(type)}</span>
        </li>
      ))}
    </ul>
  );
}
