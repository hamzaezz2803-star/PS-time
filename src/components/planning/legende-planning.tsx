import { Asterisk } from "lucide-react";
import { TEXTES_PLANNING } from "@/lib/textes/planning";
import { cn } from "@/lib/utils";

const textes = TEXTES_PLANNING.legende;

function Element({ apercu, libelle }: { apercu: string; libelle: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={cn("inline-block h-5 w-8 shrink-0 rounded", apercu)} aria-hidden="true" />
      <span>{libelle}</span>
    </li>
  );
}

/** Légende des couleurs et des marques : jamais la couleur seule (codes écrits, étoile, pointillé). */
export function LegendePlanning() {
  return (
    <section className="rounded-xl border border-bordure bg-surface px-4 py-3 shadow-carte sm:px-5">
      <h2 className="mb-2 text-sm font-semibold text-marine">{textes.titre}</h2>
      <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-texte-secondaire">
        <Element apercu="border border-bordure bg-surface" libelle={textes.horaire} />
        <Element apercu="bg-regle-orange-fond border border-regle-orange/40" libelle={textes.absence} />
        <Element apercu="bg-regle-turquoise-fond border border-regle-turquoise/40" libelle={textes.presence} />
        <Element apercu="bg-regle-vert-fond border border-regle-vert/40" libelle={textes.repos} />
        <Element apercu="bg-canevas border border-bordure" libelle={textes.aucunHoraire} />
        <Element apercu="border-2 border-dashed border-texte-secondaire" libelle={textes.enHeures} />
        <Element apercu="ring-2 ring-primaire" libelle={textes.aujourdhui} />
        <li className="flex items-center gap-2">
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-erreur text-white" aria-hidden="true">
            <Asterisk className="size-3.5" />
          </span>
          <span>{textes.anomalie}</span>
        </li>
      </ul>
    </section>
  );
}
