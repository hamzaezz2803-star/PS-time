import { CalendarCheck, CircleCheck, CircleAlert, CircleX, Hourglass, type LucideIcon } from "lucide-react";
import type { BilanJour } from "@/lib/metier/statistiques-presence";
import { TEXTES_PRESENCE } from "@/lib/textes/presence";
import { cn } from "@/lib/utils";
import { Anneau } from "./anneau";

const textes = TEXTES_PRESENCE.statistiques;

type Part = { cle: keyof typeof textes.statuts; valeur: number; fond: string; trait: string; Icone: LucideIcon; teinteIcone: string };

/** Répartition du jour en anneau (un tout découpé en parts), avec la légende en nombres et en %. */
export function RepartitionJour({ bilan }: { bilan: BilanJour }) {
  const parts: Part[] = [
    { cle: "a_l_heure", valeur: bilan.aLHeure, fond: "bg-graphe-a-l-heure", trait: "stroke-graphe-a-l-heure", Icone: CircleCheck, teinteIcone: "text-succes" },
    { cle: "en_retard", valeur: bilan.enRetard, fond: "bg-graphe-retard", trait: "stroke-graphe-retard", Icone: CircleAlert, teinteIcone: "text-attention" },
    { cle: "absent", valeur: bilan.absents, fond: "bg-graphe-absent", trait: "stroke-graphe-absent", Icone: CircleX, teinteIcone: "text-erreur" },
    { cle: "justifie", valeur: bilan.justifies, fond: "bg-graphe-justifie", trait: "stroke-graphe-justifie", Icone: CalendarCheck, teinteIcone: "text-graphe-justifie" },
    { cle: "attendu", valeur: bilan.attendus, fond: "bg-graphe-attente", trait: "stroke-graphe-attente", Icone: Hourglass, teinteIcone: "text-texte-secondaire" },
  ];
  const total = parts.reduce((somme, part) => somme + part.valeur, 0);
  const part = (valeur: number) => (total === 0 ? 0 : Math.round((valeur / total) * 100));

  return (
    <figure className="flex flex-col gap-4">
      <figcaption>
        <span className="block text-base font-semibold text-marine">{textes.graphiques.repartition}</span>
        <span className="block text-sm text-texte-secondaire">{textes.graphiques.repartitionAide(bilan.prevus)}</span>
      </figcaption>
      {total > 0 && (
        <Anneau
          parts={parts.map((p) => ({ cle: p.cle, libelle: textes.tuiles.partStatut(textes.statuts[p.cle], p.valeur, part(p.valeur)), valeur: p.valeur, trait: p.trait }))}
          libelleAccessible={parts.map((p) => textes.tuiles.partStatut(textes.statuts[p.cle], p.valeur, part(p.valeur))).join(", ")}
          className="mx-auto"
          centre={
            <>
              <span className="text-3xl font-semibold tracking-tight text-marine tabular-nums">{total}</span>
              <span className="text-sm text-texte-secondaire">{textes.graphiques.attendusAujourdhui}</span>
            </>
          }
        />
      )}
      <ul className="grid gap-1.5 text-sm">
        {parts.map((p) => (
          <li key={p.cle} className="flex items-center gap-2 text-texte">
            <span className={cn("size-3 shrink-0 rounded-[3px]", p.fond)} aria-hidden="true" />
            <p.Icone className={cn("size-4 shrink-0", p.teinteIcone)} aria-hidden="true" />
            <span className="flex-1">{textes.statuts[p.cle]}</span>
            <span className="font-semibold tabular-nums">{p.valeur}</span>
            <span className="w-11 text-end text-texte-secondaire tabular-nums">{part(p.valeur)} %</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
