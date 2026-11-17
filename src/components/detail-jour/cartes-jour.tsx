import type { ReactNode } from "react";
import { CalendarClock, ClipboardList, Hand, Sparkles } from "lucide-react";
import { PastilleEtat } from "@/components/exceptions/pastille-etat";
import { ResultatPointage } from "@/components/exceptions/resultat-pointage";
import { Pastille } from "@/components/ui/pastille";
import { formaterHeure, formaterJour, initiales } from "@/lib/formats";
import { formaterMinutes } from "@/lib/metier/compteurs/format";
import { minutesVersHeure } from "@/lib/metier/programme";
import { TEXTES_DETAIL_JOUR } from "@/lib/textes/detail-jour";
import type { DetailJour } from "@/types";

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
      <div className="flex min-w-0 flex-1 flex-col">
        <h2 className="truncate text-xl font-semibold text-marine">{employe.nomComplet}</h2>
        <p className="text-sm text-texte-secondaire">
          <span className="font-mono tabular-nums">{employe.matricule}</span> · {employe.departement}
        </p>
      </div>
      <p className="rounded-lg bg-ciel px-3 py-1.5 text-base font-semibold capitalize text-marine tabular-nums">{formaterJour(detail.date)}</p>
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

/** Pointages du jour : heure, état, source et résultat d'après le planning. */
export function CartePointages({ pointages }: { pointages: DetailJour["pointages"] }) {
  const t = textes.pointages;
  return (
    <Carte titre={t.titre} Icone={ClipboardList} action={<span className="rounded-md bg-fond px-2 py-0.5 text-sm tabular-nums text-texte-secondaire ring-1 ring-inset ring-bordure">{t.total(pointages.length)}</span>}>
      {pointages.length === 0 ? (
        <p className="text-base text-texte-secondaire">{t.aucun}</p>
      ) : (
        <ol className="flex flex-col">
          {pointages.map((pointage) => (
            <li key={pointage.id} className="flex flex-wrap items-start gap-x-3 gap-y-1.5 border-s-2 border-primaire/30 py-2 ps-3">
              <span className="w-14 text-base font-semibold text-texte tabular-nums">{formaterHeure(new Date(pointage.horodatage))}</span>
              <span className="flex flex-col items-start gap-1">
                <PastilleEtat etat={pointage.etat} />
                {pointage.source === "manuel" && (
                  <span className="inline-flex items-center gap-1 text-sm text-texte-secondaire">
                    <Hand className="size-3.5" aria-hidden="true" />
                    {t.manuel}
                  </span>
                )}
              </span>
              <span className="ms-auto">
                <ResultatPointage statut={pointage.statut} />
              </span>
            </li>
          ))}
        </ol>
      )}
    </Carte>
  );
}
