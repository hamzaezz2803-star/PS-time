import { CircleAlert, CircleCheck, CircleX, Clock4, Info, UserCheck, UserX, type LucideIcon } from "lucide-react";
import { formaterDuree } from "@/lib/metier/programme";
import { TEXTES_PRESENCE } from "@/lib/textes/presence";
import { cn } from "@/lib/utils";

const textes = TEXTES_PRESENCE.statistiques;

/**
 * Chiffres de DÉMONSTRATION, affichés comme tels (bandeau « Aperçu de démonstration ») pour
 * présenter l'écran. À remplacer par des calculs sur les vrais pointages (lib/metier) plus tard.
 */
const DEMO = {
  effectif: 48,
  aLHeure: 39,
  retards: 3,
  absents: 6,
  heuresSupMinutes: 750,
  semaine: [
    { jour: "Lun.", taux: 94 },
    { jour: "Mar.", taux: 91 },
    { jour: "Mer.", taux: 96 },
    { jour: "Jeu.", taux: 88 },
    { jour: "Ven.", taux: 93 },
    { jour: "Sam.", taux: 81 },
  ],
};
const PRESENTS = DEMO.aLHeure + DEMO.retards;

function Chiffre({ libelle, valeur, detail, Icone, teinte }: { libelle: string; valeur: string; detail?: string; Icone: LucideIcon; teinte: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-bordure bg-surface p-4">
      <span className="flex items-center justify-between gap-2 text-sm font-medium text-texte-secondaire">
        {libelle}
        <span className={cn("flex size-8 items-center justify-center rounded-md", teinte)}>
          <Icone className="size-4" aria-hidden="true" />
        </span>
      </span>
      <span className="text-2xl font-bold tabular-nums tracking-tight text-marine">{valeur}</span>
      {detail && <span className="-mt-2 text-sm tabular-nums text-texte-secondaire">{detail}</span>}
    </div>
  );
}

/** Barres verticales d'une seule teinte : taux de présence par jour (survol = valeur exacte). */
function BarresSemaine() {
  const dernier = DEMO.semaine[DEMO.semaine.length - 1];
  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="text-sm font-medium text-texte">{textes.tauxSemaine}</figcaption>
      <div className="relative h-36 border-b border-bordure" aria-hidden="true">
        {/* Repère discret à 50 % et 100 %. */}
        <span className="absolute inset-x-0 top-0 border-t border-dashed border-bordure" />
        <span className="absolute inset-x-0 top-1/2 border-t border-dashed border-bordure" />
        <div className="absolute inset-0 flex items-end justify-around gap-2 px-1">
          {DEMO.semaine.map(({ jour, taux }) => (
            <div key={jour} className="group relative flex h-full w-full max-w-10 items-end justify-center">
              <span className="w-full rounded-t-[4px] bg-primaire transition-opacity duration-150 group-hover:opacity-80" style={{ height: `${taux}%` }} />
              <span className="pointer-events-none absolute -top-8 rounded-md bg-marine px-2 py-1 text-xs font-medium tabular-nums text-white opacity-0 shadow-flottant transition-opacity duration-150 group-hover:opacity-100">
                {jour} {taux} %
              </span>
              {jour === dernier.jour && (
                <span className="absolute text-xs font-semibold tabular-nums text-marine group-hover:opacity-0" style={{ bottom: `calc(${taux}% + 4px)` }}>
                  {taux} %
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-around gap-2 px-1 text-xs text-texte-secondaire" aria-hidden="true">
        {DEMO.semaine.map(({ jour }) => (
          <span key={jour} className="w-full max-w-10 text-center">{jour}</span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{textes.tauxSemaine}</caption>
        <thead><tr><th>{textes.tableau.jour}</th><th>{textes.tableau.taux}</th></tr></thead>
        <tbody>{DEMO.semaine.map(({ jour, taux }) => <tr key={jour}><td>{jour}</td><td>{taux} %</td></tr>)}</tbody>
      </table>
    </figure>
  );
}

/** Barre segmentée du jour, couleurs d'état avec icône et libellé (jamais la couleur seule). */
function Repartition() {
  const parts = [
    { cle: "a_l_heure", valeur: DEMO.aLHeure, couleur: "bg-succes", texte: "text-succes", Icone: CircleCheck },
    { cle: "retard", valeur: DEMO.retards, couleur: "bg-attention", texte: "text-attention", Icone: CircleAlert },
    { cle: "absent", valeur: DEMO.absents, couleur: "bg-erreur", texte: "text-erreur", Icone: CircleX },
  ] as const;
  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="text-sm font-medium text-texte">{textes.repartition}</figcaption>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-md" aria-hidden="true">
        {parts.map((part) => (
          <span key={part.cle} className={cn("h-full first:rounded-s-md last:rounded-e-md", part.couleur)} style={{ width: `${(part.valeur / DEMO.effectif) * 100}%` }} title={`${textes.statuts[part.cle]} : ${part.valeur}`} />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {parts.map((part) => (
          <li key={part.cle} className="flex items-center gap-1.5 text-texte">
            <part.Icone className={cn("size-4", part.texte)} aria-hidden="true" />
            {textes.statuts[part.cle]}
            <span className="font-semibold tabular-nums">{part.valeur}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** Statistiques de présence : aperçu de démonstration, clairement signalé comme tel. */
export function StatistiquesApercu() {
  const taux = Math.round((PRESENTS / DEMO.effectif) * 1000) / 10;
  return (
    <section aria-labelledby="titre-statistiques" className="flex flex-col gap-5 rounded-xl border border-bordure bg-surface p-4 shadow-carte sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 id="titre-statistiques" className="text-lg font-semibold text-marine">{textes.titre}</h2>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-attention/10 px-2 py-1 text-sm font-medium text-attention ring-1 ring-inset ring-attention/25">
          <Info className="size-4" aria-hidden="true" />
          {textes.apercu}
        </span>
      </div>
      <p className="-mt-3 text-sm text-texte-secondaire">{textes.aideApercu}</p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Chiffre libelle={textes.presents} valeur={`${taux.toLocaleString("fr-FR")} %`} detail={textes.surEffectif(PRESENTS, DEMO.effectif)} Icone={UserCheck} teinte="bg-succes/10 text-succes" />
        <Chiffre libelle={textes.retards} valeur={String(DEMO.retards)} Icone={CircleAlert} teinte="bg-attention/10 text-attention" />
        <Chiffre libelle={textes.absents} valeur={String(DEMO.absents)} Icone={UserX} teinte="bg-erreur/10 text-erreur" />
        <Chiffre libelle={textes.heuresSup} valeur={formaterDuree(DEMO.heuresSupMinutes)} Icone={Clock4} teinte="bg-ciel text-primaire" />
      </div>

      <div className="grid gap-6 md:grid-cols-[3fr_2fr]">
        <BarresSemaine />
        <Repartition />
      </div>
    </section>
  );
}
