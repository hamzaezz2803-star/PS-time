import { TEXTES_PRESENCE } from "@/lib/textes/presence";

const textes = TEXTES_PRESENCE.statistiques.graphiques;

type Proprietes = {
  titre: string;
  /** En-tête de la première colonne (« Jour », « Heure »). */
  libelleCategorie: string;
  colonnes: { cle: string; nom: string }[];
  /** Une ligne par catégorie, valeurs déjà mises en forme, dans l'ordre des colonnes. */
  lignes: { etiquette: string; valeurs: string[] }[];
};

/** Tableau « Voir les valeurs » replié sous un graphique : tout ce qu'il montre, lisible sans la couleur ni le survol. */
export function TableauValeurs({ titre, libelleCategorie, colonnes, lignes }: Proprietes) {
  return (
    <details className="text-sm">
      <summary className="inline-flex min-h-11 cursor-pointer items-center rounded-md px-1 font-medium text-primaire hover:underline focus-visible:outline-2 focus-visible:outline-primaire lg:min-h-9">
        {textes.voirValeurs}
      </summary>
      <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-bordure">
        <table className="w-full text-start text-sm">
          <caption className="sr-only">{titre}</caption>
          <thead className="bg-fond text-texte-secondaire">
            <tr>
              <th scope="col" className="px-3 py-2 text-start font-medium">{libelleCategorie}</th>
              {colonnes.map((colonne) => (
                <th key={colonne.cle} scope="col" className="px-3 py-2 text-end font-medium">{colonne.nom}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lignes.map((ligne, rang) => (
              <tr key={`${ligne.etiquette}-${rang}`} className="border-t border-bordure">
                <th scope="row" className="px-3 py-1.5 text-start font-normal capitalize text-texte">{ligne.etiquette}</th>
                {ligne.valeurs.map((valeur, colonne) => (
                  <td key={colonnes[colonne]?.cle ?? colonne} className="px-3 py-1.5 text-end tabular-nums text-texte">{valeur}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
