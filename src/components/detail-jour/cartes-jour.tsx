import type { ReactNode } from "react";
import { CalendarClock, Camera, ClipboardList, Hand, MapPin, ScanLine, Smartphone, Sparkles } from "lucide-react";
import { PastilleEtat } from "@/components/exceptions/pastille-etat";
import { ResultatPointage } from "@/components/exceptions/resultat-pointage";
import { Pastille } from "@/components/ui/pastille";
import { CHEMIN_PHOTO_POINTAGE } from "@/lib/constantes";
import { formaterHeure, formaterJour, initiales } from "@/lib/formats";
import { lienCarte } from "@/lib/metier/pointage-distance";
import { formaterMinutes } from "@/lib/metier/compteurs/format";
import { minutesVersHeure } from "@/lib/metier/programme";
import { TEXTES_DETAIL_JOUR } from "@/lib/textes/detail-jour";
import type { DetailJour } from "@/types";
import { AjoutPointageJour, SuppressionPointageJour } from "./correction-pointages";

const textes = TEXTES_DETAIL_JOUR;

/** Cadre commun des cartes : titre avec icône, contenu. */
export function Carte({ titre, Icone, action, children }: { titre: string; Icone: typeof CalendarClock; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col rounded-xl border border-bordure bg-surface shadow-carte">
      <div className="flex items-center gap-2.5 border-b border-bordure px-4 py-3 sm:px-5">
        <span className="flex size-8 items-center justify-center rounded-md bg-ciel text-primaire">
          <Icone className="size-4" aria-hidden="true" />
        </span>
        <h2 className="flex-1 text-base font-semibold text-marine">{titre}</h2>
        {action}
      </div>
      <div className="flex-1 p-4 sm:p-5">{children}</div>
    </section>
  );
}

/** Nom, matricule, département et date affichée. */
export function EnTeteEmploye({ detail }: { detail: DetailJour }) {
  const { employe } = detail;
  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="flex size-12 items-center justify-center rounded-xl bg-primaire text-lg font-semibold text-white" aria-hidden="true">
        {initiales(employe.nomComplet)}
      </span>
      <div className="flex min-w-40 flex-1 flex-col">
        <h2 className="text-xl font-semibold text-marine">{employe.nomComplet}</h2>
        <p className="text-sm text-texte-secondaire">
          <span className="font-mono tabular-nums">{employe.matricule}</span> · {employe.departement}
        </p>
      </div>
      <p className="rounded-lg bg-ciel px-3 py-1.5 text-base font-semibold text-marine tabular-nums">{formaterJour(detail.date)}</p>
    </div>
  );
}

function Ligne({ libelle, children }: { libelle: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="text-sm text-texte-secondaire">{libelle}</dt>
      <dd className="text-base font-medium text-texte tabular-nums">{children}</dd>
    </div>
  );
}

/** Horaire prévu (profil, plage, durée) et heures réelles, ou « aucun horaire ». */
export function CarteHoraire({ horaire }: { horaire: DetailJour["horaire"] }) {
  const t = textes.horaire;
  if (!horaire) {
    return (
      <Carte titre={t.titre} Icone={CalendarClock}>
        <p className="text-base text-texte-secondaire">{t.aucun}</p>
      </Carte>
    );
  }
  const heure = (minute: number | null) => (minute === null ? <span className="text-attention">{t.manquant}</span> : minutesVersHeure(minute));
  return (
    <Carte titre={t.titre} Icone={CalendarClock}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Pastille Icone={CalendarClock}>
          <span className="font-mono">{horaire.profilCode}</span> {horaire.profilNom}
        </Pastille>
        <Pastille ton="neutre" Icone={horaire.estDynamique ? Sparkles : CalendarClock}>{horaire.estDynamique ? t.dynamique : t.rotation}</Pastille>
      </div>
      <dl className="divide-y divide-bordure">
        <Ligne libelle={t.prevu}>{t.plage(minutesVersHeure(horaire.debutPrevu), minutesVersHeure(horaire.finPrevue))}</Ligne>
        <Ligne libelle={t.duree}>{formaterMinutes(horaire.dureePrevue)}</Ligne>
        <Ligne libelle={t.entree}>{heure(horaire.entree)}</Ligne>
        <Ligne libelle={t.sortie}>{heure(horaire.sortie)}</Ligne>
      </dl>
    </Carte>
  );
}

type PointageJour = DetailJour["pointages"][number];

const LIEN_ORIGINE = "inline-flex min-h-8 items-center gap-1 rounded-md px-1.5 font-medium text-primaire underline-offset-2 hover:bg-ciel hover:underline focus-visible:outline-2 focus-visible:outline-primaire";

/** Pointage fait par l'employé depuis son appareil, avec liens vers sa position et sa photo. */
function OrigineDistance({ pointage }: { pointage: PointageJour }) {
  const t = textes.pointages;
  const appareil = pointage.appareil ? t.appareils[pointage.appareil] : null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1 text-sm text-texte-secondaire">
      <Smartphone className="size-3.5" aria-hidden="true" />
      <span className="font-medium text-texte">{t.distance}</span>
      {appareil && <span>({appareil})</span>}
      {pointage.position && (
        <a href={lienCarte(pointage.position.latitude, pointage.position.longitude)} target="_blank" rel="noopener noreferrer" className={LIEN_ORIGINE} title={t.voirPositionAide} aria-label={t.voirPositionAide}>
          <MapPin className="size-3.5" aria-hidden="true" />
          {t.voirPosition}
        </a>
      )}
      {pointage.aPhoto && (
        <a href={CHEMIN_PHOTO_POINTAGE(pointage.id)} target="_blank" rel="noopener" className={LIEN_ORIGINE} title={t.voirPhotoAide} aria-label={t.voirPhotoAide}>
          <Camera className="size-3.5" aria-hidden="true" />
          {t.voirPhoto}
        </a>
      )}
    </span>
  );
}

/** D'où vient le pointage : la badgeuse, à distance, ou une saisie manuelle avec le nom et l'identifiant de son auteur. */
function OriginePointage({ pointage }: { pointage: PointageJour }) {
  const t = textes.pointages;
  if (pointage.source === "distance") return <OrigineDistance pointage={pointage} />;
  if (pointage.source !== "manuel") {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-texte-secondaire">
        <ScanLine className="size-3.5" aria-hidden="true" />
        {t.badgeuse}
      </span>
    );
  }
  const auteur = pointage.saisiParNom && pointage.saisiParIdentifiant ? t.saisiPar(pointage.saisiParNom, pointage.saisiParIdentifiant) : t.compteSupprime;
  return (
    <span className="inline-flex flex-wrap items-center gap-1 text-sm text-texte-secondaire">
      <Hand className="size-3.5" aria-hidden="true" />
      <span className="font-medium text-texte">{t.manuel}</span>
      <span>{auteur}</span>
    </span>
  );
}

/**
 * Pointages du jour : heure, état, origine (badgeuse ou saisie manuelle et son auteur) et résultat
 * d'après le planning. Avec la page Pointage manuel : ajout d'un pointage manquant et suppression
 * d'une saisie manuelle, sans quitter le détail.
 */
export function CartePointages({
  pointages,
  correction,
}: {
  pointages: DetailJour["pointages"];
  /** Présent seulement si le compte peut saisir des pointages manuels. */
  correction?: { employeId: string; date: string; libelleJour: string };
}) {
  const t = textes.pointages;
  const action = (
    <span className="flex items-center gap-2">
      {correction && <AjoutPointageJour {...correction} />}
      <span className="rounded-md bg-fond px-2 py-0.5 text-sm tabular-nums text-texte-secondaire ring-1 ring-inset ring-bordure">{t.total(pointages.length)}</span>
    </span>
  );
  return (
    <Carte titre={t.titre} Icone={ClipboardList} action={action}>
      {pointages.length === 0 ? (
        <p className="text-base text-texte-secondaire">{t.aucun}</p>
      ) : (
        <ol className="flex flex-col">
          {pointages.map((pointage) => {
            const heure = formaterHeure(new Date(pointage.horodatage));
            return (
              <li key={pointage.id} className="flex flex-wrap items-start gap-x-3 gap-y-1.5 border-s-2 border-primaire/30 py-2 ps-3">
                <span className="w-14 text-base font-semibold text-texte tabular-nums">{heure}</span>
                <span className="flex min-w-0 flex-col items-start gap-1">
                  <PastilleEtat etat={pointage.etat} />
                  <OriginePointage pointage={pointage} />
                  {pointage.remarque && <span className="text-sm text-texte-secondaire">{pointage.remarque}</span>}
                </span>
                <span className="ms-auto flex items-start gap-1">
                  <ResultatPointage statut={pointage.statut} />
                  {correction && pointage.source === "manuel" && <SuppressionPointageJour id={pointage.id} heure={heure} />}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </Carte>
  );
}
