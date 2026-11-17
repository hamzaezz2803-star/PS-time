import Link from "next/link";
import { CircleAlert, Gauge, TrendingDown, TrendingUp, Equal } from "lucide-react";
import { CHEMIN_COMPTEURS } from "@/lib/constantes";
import { formaterJour } from "@/lib/formats";
import { formaterValeur } from "@/lib/metier/compteurs/format";
import { PERIODICITES, type Periodicite } from "@/lib/metier/compteurs/periodes";
import { TEXTES_DETAIL_JOUR } from "@/lib/textes/detail-jour";
import type { Compteur, DetailJour, ValeurAffichee } from "@/types";
import { Carte } from "./cartes-jour";

const textes = TEXTES_DETAIL_JOUR.compteurs;
const JOURS_TENDANCE = 7;

/** Mini-barres des 7 derniers jours ; les valeurs sont aussi lisibles en clair par les lecteurs d'écran. */
function Tendance({ compteur, points }: { compteur: Compteur; points: { jour: string; valeur: number | null }[] }) {
  const maximum = Math.max(1, ...points.map((point) => Math.abs(point.valeur ?? 0)));
  return (
    <figure className="flex flex-col gap-1">
      <div className="flex h-8 items-end gap-1" aria-hidden="true">
        {points.map((point, index) => (
          <span
            key={point.jour}
            className={point.valeur === null ? "h-1 flex-1 rounded-sm border border-dashed border-bordure-champ" : index === points.length - 1 ? "flex-1 rounded-sm bg-primaire" : "flex-1 rounded-sm bg-primaire/30"}
            style={point.valeur === null ? undefined : { height: `${Math.max(8, (Math.abs(point.valeur) / maximum) * 100)}%` }}
          />
        ))}
      </div>
      <figcaption className="sr-only">
        {textes.tendance(compteur.nom)} :{" "}
        {points.map((point) => textes.valeurJour(formaterJour(point.jour), point.valeur === null ? textes.sansValeur : formaterValeur(point.valeur, compteur.unite))).join(", ")}
      </figcaption>
    </figure>
  );
}

/** Écart avec la veille (icône et texte, jamais la couleur seule). */
function EcartVeille({ compteur, valeur, veille }: { compteur: Compteur; valeur: number; veille: number | null }) {
  if (veille === null) return null;
  const ecart = valeur - veille;
  const Icone = ecart === 0 ? Equal : ecart > 0 ? TrendingUp : TrendingDown;
  return (
    <p className="flex items-center gap-1.5 text-sm text-texte-secondaire">
      <Icone className="size-4" aria-hidden="true" />
      {ecart === 0 ? textes.egalVeille : textes.ecartVeille(formaterValeur(Math.abs(ecart), compteur.unite), ecart > 0)}
    </p>
  );
}

function CarteValeur({ compteur, valeur, points }: { compteur: Compteur; valeur: ValeurAffichee; points?: { jour: string; valeur: number | null }[] }) {
  const veille = points && points.length >= 2 ? points[points.length - 2].valeur : null;
  return (
    <article className="flex w-60 shrink-0 snap-start flex-col gap-2 rounded-lg border border-bordure bg-surface p-4">
      <h4 className="text-sm font-medium text-texte-secondaire">{compteur.nom}</h4>
      {valeur.valeur !== null ? (
        <p className="text-2xl font-semibold text-marine tabular-nums">{formaterValeur(valeur.valeur, compteur.unite)}</p>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-1.5 text-base font-semibold text-attention">
            <CircleAlert className="size-4" aria-hidden="true" />
            {textes.nonCalculable}
          </p>
          <p className="text-sm text-texte-secondaire">{valeur.message}</p>
        </div>
      )}
      {valeur.valeur !== null && <EcartVeille compteur={compteur} valeur={valeur.valeur} veille={veille} />}
      {points && <Tendance compteur={compteur} points={points} />}
      <p className="mt-auto truncate border-t border-bordure pt-2 font-mono text-sm text-texte-secondaire" title={compteur.formule}>
        <span className="sr-only">{textes.formule} : </span>
        {compteur.formule}
      </p>
    </article>
  );
}

/** Points de tendance d'un compteur journalier : les 7 derniers jours de l'historique. */
function pointsTendance(detail: DetailJour, idCompteur: string) {
  return detail.historique.slice(-JOURS_TENDANCE).map((jour) => ({
    jour: jour.jour,
    valeur: jour.valeurs.find((valeur) => valeur.idCompteur === idCompteur)?.valeur ?? null,
  }));
}

function GroupePeriode({ detail, periodicite }: { detail: DetailJour; periodicite: Periodicite }) {
  const periode = detail.periodes[periodicite];
  const valeurs = detail.valeurs[periodicite];
  const sousTitre =
    periodicite === "JOUR"
      ? formaterJour(periode.debut)
      : `${textes.periode(formaterJour(periode.debut), formaterJour(periode.fin))}${periode.finCalcul < periode.fin ? `, ${textes.jusquA(formaterJour(periode.finCalcul))}` : ""}`;
  return (
    <section aria-labelledby={`groupe-${periodicite}`} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h3 id={`groupe-${periodicite}`} className="text-base font-semibold text-marine">{textes.periodes[periodicite]}</h3>
        <span className="text-sm text-texte-secondaire">{sousTitre}</span>
      </div>
      {valeurs.length === 0 ? (
        <p className="text-sm text-texte-secondaire">{textes.aucunPourPeriode}</p>
      ) : (
        <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2" tabIndex={0} role="group" aria-label={textes.periodes[periodicite]}>
          {valeurs.map((valeur) => {
            const compteur = detail.compteurs.find((element) => element.id === valeur.idCompteur);
            return compteur ? (
              <CarteValeur key={valeur.idCompteur} compteur={compteur} valeur={valeur} points={periodicite === "JOUR" ? pointsTendance(detail, compteur.id) : undefined} />
            ) : null;
          })}
        </div>
      )}
    </section>
  );
}

/** Compteurs actifs groupés par jour, semaine et mois (bandes défilables). */
export function CompteursJour({ detail }: { detail: DetailJour }) {
  return (
    <Carte titre={textes.titre} Icone={Gauge} action={<Link href={CHEMIN_COMPTEURS} className="rounded-md px-2 py-1 text-sm font-semibold text-primaire hover:bg-ciel focus-visible:outline-2 focus-visible:outline-primaire">{textes.lienGestion}</Link>}>
      {detail.compteurs.length === 0 ? (
        <div className="flex flex-col gap-1">
          <p className="text-base text-texte">{textes.aucun}</p>
          <p className="text-sm text-texte-secondaire">{textes.aucunAction}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {PERIODICITES.map((periodicite) => (
            <GroupePeriode key={periodicite} detail={detail} periodicite={periodicite} />
          ))}
        </div>
      )}
    </Carte>
  );
}
