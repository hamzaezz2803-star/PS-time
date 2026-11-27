import { cn } from "@/lib/utils";

export type LigneInfobulle = { cle: string; nom: string; valeur: string; couleur: string };

/**
 * Infobulle d'un graphique, posée au-dessus de la colonne `rang` sur `nombre` (axe de 3,5rem à
 * gauche). Près d'un bord, elle se décale vers l'intérieur pour rester dans la carte.
 */
export function InfobulleGraphique({ rang, nombre, titre, lignes }: { rang: number; nombre: number; titre: string; lignes: LigneInfobulle[] }) {
  const position = (rang + 0.5) / nombre;
  return (
    <div
      role="presentation"
      className={cn(
        "pointer-events-none absolute top-0 z-10 min-w-40 rounded-lg bg-surface px-3 py-2 text-sm shadow-flottant ring-1 ring-bordure",
        position < 0.25 ? "-translate-x-[15%]" : position > 0.75 ? "-translate-x-[85%]" : "-translate-x-1/2",
      )}
      style={{ left: `calc(3.5rem + (100% - 3.5rem) * ${position})` }}
    >
      <p className="mb-1 font-medium text-texte-secondaire">{titre}</p>
      {lignes.map((ligne) => (
        <p key={ligne.cle} className="flex items-center gap-2">
          <span className={cn("h-0.5 w-3 rounded-full", ligne.couleur)} aria-hidden="true" />
          <span className="font-semibold tabular-nums text-texte">{ligne.valeur}</span>
          <span className="text-texte-secondaire">{ligne.nom}</span>
        </p>
      ))}
    </div>
  );
}
