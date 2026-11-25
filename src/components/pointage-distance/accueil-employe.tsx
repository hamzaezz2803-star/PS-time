import { Clock3, ShieldAlert } from "lucide-react";
import { HorlogePalettes } from "@/components/ui/horloge-palettes";
import type { EmployePourPointage, PointageDuJourEmploye } from "@/lib/donnees/pointage-distance";
import { formaterDate, formaterHeure } from "@/lib/formats";
import { TEXTES_EXCEPTIONS } from "@/lib/textes/exceptions";
import { TEXTES_POINTAGE_DISTANCE } from "@/lib/textes/pointage-distance";

const textes = TEXTES_POINTAGE_DISTANCE;
const { etats } = TEXTES_EXCEPTIONS.pointages;
const CARTE = "rounded-xl border border-bordure bg-surface p-5 shadow-carte";

function Info({ libelle, valeur }: { libelle: string; valeur: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-sm text-texte-secondaire">{libelle}</dt>
      <dd className="text-base font-medium text-texte">{valeur ?? textes.infos.nonRenseigne}</dd>
    </div>
  );
}

/** « Bonjour, Prénom », date, horloge et informations de l'employé (jamais de donnée sensible). */
export function AccueilEmploye({ employe, maintenant }: { employe: EmployePourPointage; maintenant: Date }) {
  return (
    <section className={`${CARTE} flex flex-col gap-5`} aria-labelledby="titre-bonjour">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 id="titre-bonjour" className="text-2xl font-bold text-marine sm:text-3xl">
          {textes.bonjour(employe.prenom)}
        </h1>
        <p className="text-base capitalize text-texte-secondaire">{formaterDate(maintenant)}</p>
        <HorlogePalettes libelle={textes.horloge} />
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-bordure pt-4">
        <Info libelle={textes.infos.matricule} valeur={employe.matricule} />
        <Info libelle={textes.infos.departement} valeur={employe.departement} />
        <Info libelle={textes.infos.poste} valeur={employe.poste} />
        <Info libelle={textes.infos.site} valeur={employe.site} />
      </dl>
    </section>
  );
}

/** Pourquoi l'employé ne peut pas pointer ici (autorisation retirée, appareil non permis). */
export function RefusPointage({ message }: { message: string }) {
  return (
    <section className={`${CARTE} flex items-start gap-3`} role="alert">
      <ShieldAlert className="mt-0.5 size-6 shrink-0 text-erreur" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-marine">{textes.refus.titre}</h2>
        <p className="text-base text-texte">{message}</p>
      </div>
    </section>
  );
}

/** Pointages d'aujourd'hui, toutes origines (badgeuse, saisie manuelle, à distance). */
export function PointagesDuJour({ pointages }: { pointages: PointageDuJourEmploye[] }) {
  return (
    <section className={`${CARTE} flex flex-col gap-3`} aria-labelledby="titre-aujourdhui">
      <h2 id="titre-aujourdhui" className="flex items-center gap-2 text-lg font-semibold text-marine">
        <Clock3 className="size-5 text-primaire" aria-hidden="true" />
        {textes.aujourdhui.titre}
      </h2>
      {pointages.length === 0 ? (
        <p className="text-base text-texte-secondaire">{textes.aujourdhui.aucun}</p>
      ) : (
        <ol className="flex flex-col divide-y divide-bordure">
          {pointages.map((pointage) => (
            <li key={pointage.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-base text-texte">{etats[pointage.etat as keyof typeof etats] ?? pointage.etat}</span>
              <span className="text-base font-semibold tabular-nums text-marine">{formaterHeure(new Date(pointage.horodatage))}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
