import { AlarmClock, CalendarCheck2, CalendarX2, Clock, Hourglass, Sparkles, type LucideIcon } from "lucide-react";
import { initiales } from "@/lib/formats";
import type { EmployePlanning } from "@/lib/donnees/planning-consultation";
import { formaterDuree } from "@/lib/metier/programme";
import type { TotauxPlanning } from "@/lib/metier/planning-consultation";
import { TEXTES_PLANNING } from "@/lib/textes/planning";
import { cn } from "@/lib/utils";

const textes = TEXTES_PLANNING.resume;

function Chiffre({ libelle, valeur, Icone, estAlerte = false }: { libelle: string; valeur: string; Icone: LucideIcon; estAlerte?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-bordure bg-fond px-3 py-2.5">
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-md", estAlerte ? "bg-erreur/10 text-erreur" : "bg-ciel text-primaire")}>
        <Icone className="size-5" aria-hidden="true" />
      </span>
      <span className="flex flex-col">
        <span className="text-lg font-bold leading-tight text-marine tabular-nums">{valeur}</span>
        <span className="text-sm text-texte-secondaire">{libelle}</span>
      </span>
    </div>
  );
}

/** Employé affiché et chiffres de la période : jours planifiés, théorique, réalisé, anomalies, événements. */
export function ResumePlanning({ employe, totaux }: { employe: EmployePlanning; totaux: TotauxPlanning }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-bordure bg-surface p-4 shadow-carte sm:p-5 lg:flex-row lg:items-center lg:gap-6">
      <div className="flex items-center gap-3 lg:min-w-60">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-marine text-base font-bold text-white" aria-hidden="true">
          {initiales(employe.nomComplet)}
        </span>
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-marine">{employe.nomComplet}</h2>
          <p className="text-sm text-texte-secondaire">{`${employe.matricule} · ${employe.departement}`}</p>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <Chiffre libelle={textes.joursPlanifies} valeur={String(totaux.joursPlanifies)} Icone={CalendarCheck2} />
        <Chiffre libelle={textes.theorique} valeur={formaterDuree(totaux.theoriqueMinutes)} Icone={Hourglass} />
        <Chiffre libelle={textes.realise} valeur={formaterDuree(totaux.travailleMinutes)} Icone={Clock} />
        <Chiffre libelle={textes.absences} valeur={String(totaux.absences)} Icone={CalendarX2} estAlerte={totaux.absences > 0} />
        <Chiffre libelle={textes.retards} valeur={String(totaux.retards)} Icone={AlarmClock} estAlerte={totaux.retards > 0} />
        <Chiffre libelle={textes.evenements} valeur={String(totaux.joursAvecEvenement)} Icone={Sparkles} />
      </div>
    </section>
  );
}
