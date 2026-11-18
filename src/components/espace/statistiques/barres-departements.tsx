import { STATISTIQUES_DEPARTEMENTS_MAX } from "@/lib/constantes";
import type { PresenceDepartement } from "@/lib/metier/statistiques-presence";
import { TEXTES_PRESENCE } from "@/lib/textes/presence";

const textes = TEXTES_PRESENCE.statistiques;

/** Les plus grands départements, puis le reste regroupé en une ligne « Autres départements ». */
function regrouper(lignes: PresenceDepartement[]): PresenceDepartement[] {
  if (lignes.length <= STATISTIQUES_DEPARTEMENTS_MAX) return lignes;
  const reste = lignes.slice(STATISTIQUES_DEPARTEMENTS_MAX - 1);
  const prevus = reste.reduce((somme, ligne) => somme + ligne.prevus, 0);
  const presents = reste.reduce((somme, ligne) => somme + ligne.presents, 0);
  const taux = prevus === 0 ? null : Math.round((presents / prevus) * 1000) / 10;
  return [...lignes.slice(0, STATISTIQUES_DEPARTEMENTS_MAX - 1), { departement: textes.graphiques.autres, prevus, presents, taux }];
}

/** Barres horizontales d'une seule teinte : taux de présence du jour par département, valeur au bout. */
export function BarresDepartements({ lignes }: { lignes: PresenceDepartement[] }) {
  return (
    <figure className="flex flex-col gap-3">
      <figcaption>
        <span className="block text-base font-semibold text-marine">{textes.graphiques.departements}</span>
        <span className="block text-sm text-texte-secondaire">{textes.graphiques.departementsAide}</span>
      </figcaption>
      {lignes.length === 0 ? (
        <p className="rounded-lg bg-fond px-3 py-4 text-sm text-texte-secondaire">{textes.graphiques.videAujourdhui}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {regrouper(lignes).map((ligne) => (
            <li key={ligne.departement} className="flex flex-col gap-1">
              <span className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium text-texte">{ligne.departement}</span>
                <span className="shrink-0 tabular-nums text-texte-secondaire">
                  <span className="font-semibold text-texte">{ligne.taux === null ? "–" : textes.pourcentage(ligne.taux)}</span>
                  {" · "}
                  {textes.graphiques.surPrevus(ligne.presents, ligne.prevus)}
                </span>
              </span>
              {/* Piste claire de la même teinte, barre de 8 px arrondie au bout. */}
              <span className="h-2 overflow-hidden rounded-full bg-ciel" aria-hidden="true">
                <span className="block h-full rounded-full bg-primaire" style={{ width: `${ligne.taux ?? 0}%` }} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}
