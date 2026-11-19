import { CalendarDays, CalendarX2, Plane, SearchX } from "lucide-react";
import { FiltresEmployeJour } from "@/components/liste/filtres-employe-jour";
import { BoutonSupprimerSaisie } from "@/components/liste/gestion-saisie";
import { PaginationListe } from "@/components/liste/pagination-liste";
import { AvatarEmploye } from "@/components/personnes/avatar-employe";
import { Pastille } from "@/components/ui/pastille";
import { CHEMIN_ABSENCES } from "@/lib/constantes";
import { chaineRecherche } from "@/lib/metier/recherche";
import { TEXTES_ABSENCES as textes } from "@/lib/textes/absences";
import type { RechercheAbsences } from "@/lib/validation/absence";
import type { AbsenceListe } from "@/types";
import { decrirePeriode } from "./periode-absence";

/** Événement : code, libellé et type (jamais la couleur seule). */
export function EvenementAffiche({ code, nom, type }: { code: string; nom: string; type: "absence" | "presence" }) {
  const estAbsence = type === "absence";
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-8 min-w-10 items-center justify-center rounded-md bg-marine px-2 font-mono text-sm font-semibold text-white">{code}</span>
      <span className="flex min-w-0 flex-col items-start gap-1">
        <span className="font-medium text-texte">{nom}</span>
        <Pastille ton={estAbsence ? "attention" : "info"} Icone={estAbsence ? CalendarX2 : Plane}>{textes.types[type]}</Pastille>
      </span>
    </span>
  );
}

/** Liste paginée des absences et événements saisis, de la plus récente à la plus ancienne. */
export function ListeAbsences({
  absences,
  total,
  page,
  nombrePages,
  recherche,
}: {
  absences: AbsenceListe[];
  total: number;
  page: number;
  nombrePages: number;
  recherche: RechercheAbsences;
}) {
  const estFiltree = recherche.employe !== "" || recherche.jour !== null;
  const lienPage = (numero: number) => `${CHEMIN_ABSENCES}${chaineRecherche({ employe: recherche.employe, jour: recherche.jour, page: numero })}`;
  const c = textes.colonnes;

  return (
    <section className="overflow-hidden rounded-xl border border-bordure bg-surface shadow-carte" aria-labelledby="titre-absences">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-bordure px-4 py-3.5 sm:px-5">
        <h2 id="titre-absences" className="text-base font-semibold text-marine">{textes.titreListe}</h2>
        <span className="rounded-md bg-fond px-2 py-0.5 text-sm font-medium tabular-nums text-texte-secondaire ring-1 ring-inset ring-bordure">{textes.total(total)}</span>
      </div>
      {(total > 0 || estFiltree) && <FiltresEmployeJour chemin={CHEMIN_ABSENCES} recherche={recherche} textes={textes.filtres} />}

      {absences.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-ciel text-primaire">
            {estFiltree ? <SearchX className="size-6" aria-hidden="true" /> : <CalendarDays className="size-6" aria-hidden="true" />}
          </span>
          <p className="text-base font-semibold text-texte">{estFiltree ? textes.aucunResultat : textes.vide}</p>
          {!estFiltree && <p className="max-w-md text-sm text-texte-secondaire">{textes.videAction}</p>}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[60rem] text-left text-sm">
            <thead className="border-b border-bordure bg-fond/70 text-texte-secondaire">
              <tr>
                {[c.employe, c.matricule, c.departement, c.evenement, c.periode, c.remarque, c.saisiPar].map((titre) => (
                  <th key={titre} scope="col" className="px-5 py-3 font-semibold">{titre}</th>
                ))}
                <th scope="col" className="px-5 py-3"><span className="sr-only">{c.actions}</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bordure text-texte">
              {absences.map((absence) => {
                const nomComplet = `${absence.prenom} ${absence.nom}`;
                return (
                  <tr key={absence.id} className="transition-colors duration-150 hover:bg-fond">
                    <td className="px-5 py-2.5">
                      <span className="flex items-center gap-3 font-medium">
                        <AvatarEmploye id={absence.employeId} nomComplet={nomComplet} photoModifieeLe={absence.photoModifieeLe} />
                        <span className="truncate">{nomComplet}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono tabular-nums text-marine">{absence.matricule}</td>
                    <td className="px-5 py-3">{absence.departement}</td>
                    <td className="px-5 py-2.5"><EvenementAffiche code={absence.evenementCode} nom={absence.evenementNom} type={absence.evenementType} /></td>
                    <td className="px-5 py-3 tabular-nums">{decrirePeriode(absence)}</td>
                    <td className="max-w-56 truncate px-5 py-3 text-texte-secondaire" title={absence.remarque ?? undefined}>{absence.remarque ?? "–"}</td>
                    <td className="px-5 py-3 text-texte-secondaire">{absence.saisiPar ?? "–"}</td>
                    <td className="px-3 py-1.5 text-right">
                      <BoutonSupprimerSaisie id={absence.id} nom={nomComplet} libelle={textes.supprimer(nomComplet)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <PaginationListe page={page} nombrePages={nombrePages} lienPage={lienPage} textes={textes} />
    </section>
  );
}
