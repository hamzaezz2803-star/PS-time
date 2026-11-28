import { Network, Server } from "lucide-react";
import type { ReseauLocal } from "@/lib/metier/badgeuses/reseau";
import { TEXTES_APPAREILS } from "@/lib/textes/appareils";

const { reseau: textes } = TEXTES_APPAREILS;

/** Réseaux privés du serveur parcourus par la recherche. */
export function PanneauReseau({ reseaux }: { reseaux: readonly ReseauLocal[] }) {
  return (
    <section aria-labelledby="titre-reseau" className="flex flex-col gap-3 rounded-lg border border-bordure bg-surface p-5 shadow-carte">
      <h2 id="titre-reseau" className="flex items-center gap-2 text-base font-semibold text-marine">
        <Network className="size-5 text-primaire" aria-hidden="true" />
        {textes.titre}
      </h2>
      {reseaux.length === 0 ? (
        <p className="rounded-md bg-attention/5 p-3 text-sm text-attention ring-1 ring-inset ring-attention/25">{textes.aucun}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {reseaux.map((reseau) => (
            <li key={reseau.reseau} className="flex flex-col gap-1 rounded-md bg-fond px-3 py-2.5">
              <span className="font-mono text-sm font-semibold tabular-nums text-texte">{textes.plage(reseau.reseau, reseau.longueurMasque)}</span>
              <span className="flex items-center gap-1.5 text-sm text-texte-secondaire">
                <Server className="size-3.5 shrink-0" aria-hidden="true" />
                {textes.serveur} <span className="font-mono tabular-nums">{reseau.adresseServeur}</span>
              </span>
              {reseau.reduit && <span className="text-sm text-texte-secondaire">{textes.reduit}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
