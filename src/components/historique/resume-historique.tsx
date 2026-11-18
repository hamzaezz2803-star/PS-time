import Link from "next/link";
import { Activity } from "lucide-react";
import { ACTIONS_HISTORIQUE, CHEMIN_HISTORIQUE } from "@/lib/constantes";
import type { ActionHistorique } from "@/lib/metier/historique";
import { TEXTES_HISTORIQUE as textes } from "@/lib/textes/historique";
import { cn } from "@/lib/utils";
import { chaineHistorique, type RechercheHistorique } from "@/lib/validation/historique";
import { STYLES_ACTIONS } from "./styles-actions";

const CARTE =
  "flex min-h-20 flex-col justify-between gap-2 rounded-xl border bg-surface p-3.5 shadow-carte transition-shadow duration-150 hover:shadow-survol focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire";

/**
 * Chiffres de la sélection, un par type d'action. Chaque carte filtre la liste sur son action ;
 * la carte « Actions » retire ce filtre. La carte choisie est repérée par sa bordure et `aria-current`.
 */
export function ResumeHistorique({ resume, recherche }: { resume: Record<ActionHistorique, number>; recherche: RechercheHistorique }) {
  const total = Object.values(resume).reduce((somme, nombre) => somme + nombre, 0);
  const lien = (action: ActionHistorique | null) => `${CHEMIN_HISTORIQUE}${chaineHistorique({ ...recherche, action, page: 1 })}`;

  return (
    <section aria-label={textes.resume.titre}>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        <li>
          <Link
            href={lien(null)}
            aria-current={recherche.action === null ? "true" : undefined}
            className={cn(CARTE, recherche.action === null ? "border-primaire ring-1 ring-primaire" : "border-bordure")}
          >
            <span className="flex items-center gap-2 text-sm font-medium text-texte-secondaire">
              <Activity className="size-4 text-primaire" aria-hidden="true" />
              {textes.resume.total}
            </span>
            <span className="text-2xl font-bold tabular-nums text-marine">{total}</span>
          </Link>
        </li>
        {ACTIONS_HISTORIQUE.map((action) => {
          const { Icone, bulle } = STYLES_ACTIONS[action];
          const estActive = recherche.action === action;
          return (
            <li key={action}>
              <Link
                href={lien(estActive ? null : action)}
                aria-current={estActive ? "true" : undefined}
                title={textes.resume.filtrer(textes.actionsPluriel[action])}
                className={cn(CARTE, estActive ? "border-primaire ring-1 ring-primaire" : "border-bordure")}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-texte-secondaire">
                  <span className={cn("flex size-6 items-center justify-center rounded-md ring-1 ring-inset", bulle)}>
                    <Icone className="size-3.5" aria-hidden="true" />
                  </span>
                  {textes.actionsPluriel[action]}
                </span>
                <span className="text-2xl font-bold tabular-nums text-marine">{resume[action]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
