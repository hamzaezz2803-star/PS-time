import { nomMoisCourt } from "@/lib/formats";
import { codeDuJour, estWeekEnd, type JourPlanning } from "@/lib/metier/planning-consultation";
import { TEXTES_PLANNING } from "@/lib/textes/planning";
import { cn } from "@/lib/utils";
import { couleursDuJour, LienJour } from "./elements-planning";

const textes = TEXTES_PLANNING;
const MOIS = Array.from({ length: 12 }, (_, rang) => rang);
const JOURS = Array.from({ length: 31 }, (_, rang) => rang + 1);

const dateDe = (annee: number, rangMois: number, numero: number) => `${annee}-${String(rangMois + 1).padStart(2, "0")}-${String(numero).padStart(2, "0")}`;

/** Une case : code (événement retenu ou profil), étoile d'anomalie, pointillé pour un événement en heures. */
function CaseAnnee({ jour, employeId, aujourdhui, peutOuvrir }: { jour: JourPlanning; employeId: string; aujourdhui: string; peutOuvrir: boolean }) {
  return (
    <LienJour
      jour={jour}
      employeId={employeId}
      peutOuvrir={peutOuvrir}
      className={cn(
        "relative flex h-8 items-center justify-center rounded px-1 text-xs font-semibold",
        couleursDuJour(jour),
        !jour.profilCode && !jour.evenement && estWeekEnd(jour.jour) && "font-normal",
        jour.aEvenementEnHeures && "outline-2 outline-dashed -outline-offset-2 outline-texte-secondaire",
        jour.jour === aujourdhui && "ring-2 ring-primaire",
      )}
    >
      <span className="truncate">{codeDuJour(jour) ?? "·"}</span>
      {jour.anomalies.length > 0 && (
        <span className="absolute right-0.5 top-0.5 size-2 rounded-full bg-erreur">
          <span className="sr-only">{textes.anomalies.titre}</span>
        </span>
      )}
    </LienJour>
  );
}

/**
 * Planning annuel (comme Gestor) : une ligne par jour du mois, une colonne par mois. Le tableau
 * défile horizontalement sur téléphone, la colonne des jours restant visible.
 */
export function PlanningAnnuel({ annee, jours, employeId, aujourdhui, peutOuvrir }: { annee: number; jours: ReadonlyMap<string, JourPlanning>; employeId: string; aujourdhui: string; peutOuvrir: boolean }) {
  return (
    <section className="overflow-x-auto rounded-xl border border-bordure bg-surface shadow-carte">
      <table className="w-full min-w-[56rem] border-separate border-spacing-1 p-2 text-sm">
        <caption className="sr-only">{textes.annuel.legendeTableau(annee)}</caption>
        <thead>
          <tr>
            <th scope="col" className="sticky left-0 z-10 bg-surface px-2 text-left font-semibold text-marine">{annee}</th>
            {MOIS.map((rang) => (
              <th key={rang} scope="col" className="px-1 pb-1 text-center font-semibold capitalize text-texte-secondaire">{nomMoisCourt(rang)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {JOURS.map((numero) => (
            <tr key={numero}>
              <th scope="row" className="sticky left-0 z-10 bg-surface px-2 text-left font-semibold tabular-nums text-texte-secondaire">{numero}</th>
              {MOIS.map((rang) => {
                const jour = jours.get(dateDe(annee, rang, numero));
                return (
                  <td key={rang} className="p-0">
                    {jour ? <CaseAnnee jour={jour} employeId={employeId} aujourdhui={aujourdhui} peutOuvrir={peutOuvrir} /> : <span className="block h-8 rounded bg-canevas/60" aria-label={textes.horsMois} />}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
