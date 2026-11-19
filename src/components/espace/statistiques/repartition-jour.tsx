import { CalendarCheck, CircleCheck, CircleAlert, CircleX, Hourglass, type LucideIcon } from "lucide-react";
import type { BilanJour } from "@/lib/metier/statistiques-presence";
import { TEXTES_PRESENCE } from "@/lib/textes/presence";
import { cn } from "@/lib/utils";

const textes = TEXTES_PRESENCE.statistiques;
/** Part minimale (en %) pour écrire le pourcentage dans le bloc sans le couper. */
const PART_MIN_ETIQUETTE = 12;

type Part = { cle: keyof typeof textes.statuts; valeur: number; fond: string; texteDedans: string; Icone: LucideIcon; teinteIcone: string };

/** Barre segmentée du jour (un tout découpé en parts), avec la légende en nombres. */
export function RepartitionJour({ bilan }: { bilan: BilanJour }) {
  const parts: Part[] = [
    { cle: "a_l_heure", valeur: bilan.aLHeure, fond: "bg-graphe-a-l-heure", texteDedans: "text-white", Icone: CircleCheck, teinteIcone: "text-succes" },
    { cle: "en_retard", valeur: bilan.enRetard, fond: "bg-graphe-retard", texteDedans: "text-texte", Icone: CircleAlert, teinteIcone: "text-attention" },
    { cle: "absent", valeur: bilan.absents, fond: "bg-graphe-absent", texteDedans: "text-white", Icone: CircleX, teinteIcone: "text-erreur" },
    { cle: "justifie", valeur: bilan.justifies, fond: "bg-graphe-justifie", texteDedans: "text-white", Icone: CalendarCheck, teinteIcone: "text-primaire" },
    { cle: "attendu", valeur: bilan.attendus, fond: "bg-graphe-attente", texteDedans: "text-texte", Icone: Hourglass, teinteIcone: "text-texte-secondaire" },
  ];
  const total = parts.reduce((somme, part) => somme + part.valeur, 0);
  const part = (valeur: number) => (total === 0 ? 0 : Math.round((valeur / total) * 100));

  return (
    <figure className="flex flex-col gap-3">
      <figcaption>
        <span className="block text-base font-semibold text-marine">{textes.graphiques.repartition}</span>
        <span className="block text-sm text-texte-secondaire">{textes.graphiques.repartitionAide(bilan.prevus)}</span>
      </figcaption>
      {total > 0 && (
        <div
          role="img"
          aria-label={parts.map((p) => `${textes.statuts[p.cle]} ${p.valeur} (${part(p.valeur)} %)`).join(", ")}
          className="flex h-7 gap-[2px]"
        >
          {parts.map((p) =>
            p.valeur > 0 ? (
              <span
                key={p.cle}
                title={`${textes.statuts[p.cle]} : ${p.valeur} (${part(p.valeur)} %)`}
                className={cn("flex h-full items-center rounded-[4px] ps-2 text-sm font-semibold tabular-nums", p.fond, p.texteDedans)}
                style={{ width: `${(p.valeur / total) * 100}%` }}
              >
                {part(p.valeur) >= PART_MIN_ETIQUETTE ? `${part(p.valeur)} %` : ""}
              </span>
            ) : null,
          )}
        </div>
      )}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {parts.map((p) => (
          <li key={p.cle} className="flex items-center gap-2 text-texte">
            <span className={cn("size-3 shrink-0 rounded-[3px]", p.fond)} aria-hidden="true" />
            <p.Icone className={cn("size-4 shrink-0", p.teinteIcone)} aria-hidden="true" />
            <span className="flex-1">{textes.statuts[p.cle]}</span>
            <span className="font-semibold tabular-nums">{p.valeur}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
