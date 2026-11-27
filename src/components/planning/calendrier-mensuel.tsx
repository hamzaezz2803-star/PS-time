import { formaterJourEnDeux } from "@/lib/formats";
import { codeDuJour, semainesDuMois, totaliser, type JourPlanning } from "@/lib/metier/planning-consultation";
import { formaterDuree } from "@/lib/metier/programme";
import { TEXTES_PLANNING } from "@/lib/textes/planning";
import { cn } from "@/lib/utils";
import { couleursDuJour, libelleSansCode, LienJour, MarqueAnomalie } from "./elements-planning";

const textes = TEXTES_PLANNING;

type ProprietesMois = { mois: string; jours: ReadonlyMap<string, JourPlanning>; employeId: string; aujourdhui: string; peutOuvrir: boolean };

/** Contenu d'une case : code (profil ou événement), théorique et réalisé. */
function ContenuCase({ jour }: { jour: JourPlanning }) {
  const code = codeDuJour(jour);
  return (
    <>
      <span className="truncate text-sm font-bold">{code ?? libelleSansCode(jour)}</span>
      {jour.theoriqueMinutes !== null && <span className="text-xs tabular-nums opacity-80">{`${textes.theoriqueCourt} ${formaterDuree(jour.theoriqueMinutes)}`}</span>}
      {jour.travailleMinutes !== null && <span className="text-xs font-medium tabular-nums text-texte">{`${textes.realiseCourt} ${formaterDuree(jour.travailleMinutes)}`}</span>}
    </>
  );
}

/** Une case du calendrier (ordinateur) : numéro du jour, étoile d'anomalie, contenu. */
function CaseJour({ jour, employeId, aujourdhui, peutOuvrir }: { jour: JourPlanning; employeId: string; aujourdhui: string; peutOuvrir: boolean }) {
  const estAujourdhui = jour.jour === aujourdhui;
  return (
    <LienJour
      jour={jour}
      employeId={employeId}
      peutOuvrir={peutOuvrir}
      className={cn(
        "flex h-full min-h-26 flex-col gap-1 rounded-lg border p-2",
        couleursDuJour(jour),
        jour.aEvenementEnHeures ? "border-2 border-dashed border-texte-secondaire" : "border-bordure",
        estAujourdhui && "ring-2 ring-primaire ring-offset-1",
      )}
    >
      <span className="flex items-center justify-between gap-1">
        <span className={cn("text-sm font-semibold tabular-nums", estAujourdhui && "flex size-6 items-center justify-center rounded-full bg-primaire text-white")}>
          {Number(jour.jour.slice(8))}
        </span>
        <MarqueAnomalie jour={jour} />
      </span>
      <ContenuCase jour={jour} />
    </LienJour>
  );
}

/** Colonne « Semaine » : numéro ISO, théorique et réalisé cumulés (comme dans Gestor). */
function CaseSemaine({ numero, jours }: { numero: number; jours: JourPlanning[] }) {
  const totaux = totaliser(jours);
  return (
    <div className="flex h-full flex-col justify-center gap-1 rounded-lg bg-ciel px-2 py-2 text-marine">
      <span className="text-sm font-bold">{textes.numeroSemaine(numero)}</span>
      <span className="text-xs tabular-nums">{`${textes.theoriqueCourt} ${formaterDuree(totaux.theoriqueMinutes)}`}</span>
      <span className="text-xs font-semibold tabular-nums">{`${textes.realiseCourt} ${formaterDuree(totaux.travailleMinutes)}`}</span>
    </div>
  );
}

const joursDeLaSemaine = (dates: (string | null)[], jours: ReadonlyMap<string, JourPlanning>) =>
  dates.flatMap((date) => (date && jours.get(date) ? [jours.get(date) as JourPlanning] : []));

/** Ordinateur et tablette : sept colonnes (lundi → dimanche) et la colonne Semaine. */
function GrilleMois({ mois, jours, employeId, aujourdhui, peutOuvrir }: ProprietesMois) {
  return (
    <div className="hidden md:block" role="table" aria-label={textes.titrePage}>
      <div role="row" className="grid grid-cols-[repeat(7,minmax(0,1fr))_6.5rem] gap-1.5 pb-1.5">
        {[...textes.joursSemaine, textes.semaine].map((nom) => (
          <span key={nom} role="columnheader" className="px-1 text-center text-sm font-semibold text-texte-secondaire">{nom}</span>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        {semainesDuMois(mois).map((semaine) => (
          <div key={semaine.debut} role="row" className="grid grid-cols-[repeat(7,minmax(0,1fr))_6.5rem] gap-1.5">
            {semaine.jours.map((date, rang) => {
              const jour = date ? jours.get(date) : undefined;
              return (
                <div key={date ?? `${semaine.debut}-${rang}`} role="cell">
                  {jour ? <CaseJour jour={jour} employeId={employeId} aujourdhui={aujourdhui} peutOuvrir={peutOuvrir} /> : <div className="h-full min-h-26 rounded-lg bg-canevas/60" aria-label={textes.horsMois} />}
                </div>
              );
            })}
            <div role="cell">
              <CaseSemaine numero={semaine.numero} jours={joursDeLaSemaine(semaine.jours, jours)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Téléphone : une ligne par jour, regroupée par semaine avec ses cumuls. */
function ListeMois({ mois, jours, employeId, aujourdhui, peutOuvrir }: ProprietesMois) {
  return (
    <div className="flex flex-col gap-4 md:hidden">
      {semainesDuMois(mois).map((semaine) => {
        const joursSemaine = joursDeLaSemaine(semaine.jours, jours);
        const totaux = totaliser(joursSemaine);
        return (
          <section key={semaine.debut} className="flex flex-col gap-1.5">
            <h3 className="flex flex-wrap items-baseline justify-between gap-2 px-1 text-sm text-texte-secondaire">
              <span className="font-bold text-marine">{textes.numeroSemaine(semaine.numero)}</span>
              <span className="tabular-nums">{`${textes.theoriqueCourt} ${formaterDuree(totaux.theoriqueMinutes)} · ${textes.realiseCourt} ${formaterDuree(totaux.travailleMinutes)}`}</span>
            </h3>
            {joursSemaine.map((jour) => {
              const { semaine: nomJour, date } = formaterJourEnDeux(jour.jour);
              return (
                <LienJour
                  key={jour.jour}
                  jour={jour}
                  employeId={employeId}
                  peutOuvrir={peutOuvrir}
                  className={cn(
                    "flex min-h-14 items-center gap-3 rounded-lg border px-3 py-2",
                    couleursDuJour(jour),
                    jour.aEvenementEnHeures ? "border-2 border-dashed border-texte-secondaire" : "border-bordure",
                    jour.jour === aujourdhui && "ring-2 ring-primaire",
                  )}
                >
                  <span className="flex w-16 shrink-0 flex-col text-sm leading-tight">
                    <span className="font-semibold capitalize">{nomJour}</span>
                    <span className="opacity-80">{date}</span>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <ContenuCase jour={jour} />
                  </span>
                  <MarqueAnomalie jour={jour} />
                </LienJour>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

/** Planning mensuel : grille sur ordinateur, liste sur téléphone. */
export function CalendrierMensuel(proprietes: ProprietesMois) {
  return (
    <section className="rounded-xl border border-bordure bg-surface p-3 shadow-carte sm:p-5">
      <GrilleMois {...proprietes} />
      <ListeMois {...proprietes} />
    </section>
  );
}
