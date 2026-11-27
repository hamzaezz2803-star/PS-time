import { ArrowRight, Briefcase, CalendarCheck, CalendarX2, CircleCheck, CircleX, Clock, Hourglass, Moon, Plane, TriangleAlert, type LucideIcon } from "lucide-react";
import { FUSEAU_HORAIRE } from "@/lib/constantes";
import { formaterMinutes } from "@/lib/metier/compteurs/format";
import { jourDansFuseau } from "@/lib/metier/dates";
import { minutesVersHeure } from "@/lib/metier/programme";
import { statutJourDetail, type StatutJourDetail } from "@/lib/metier/statut-jour-detail";
import { cn } from "@/lib/utils";
import { TEXTES_DETAIL_JOUR } from "@/lib/textes/detail-jour";
import type { JourDetail } from "@/types";

const textes = TEXTES_DETAIL_JOUR.jour;

const STATUTS: Record<StatutJourDetail, { Icone: LucideIcon; teinte: string }> = {
  a_l_heure: { Icone: CircleCheck, teinte: "bg-succes/10 text-succes" },
  retard: { Icone: Clock, teinte: "bg-attention/10 text-attention" },
  incomplet: { Icone: TriangleAlert, teinte: "bg-attention/10 text-attention" },
  sans_pointage: { Icone: CircleX, teinte: "bg-erreur/10 text-erreur" },
  absence_justifiee: { Icone: CalendarCheck, teinte: "bg-graphe-justifie/10 text-graphe-justifie" },
  evenement_presence: { Icone: Plane, teinte: "bg-ciel text-primaire" },
  repos: { Icone: Moon, teinte: "bg-canevas text-texte-secondaire" },
  repos_travaille: { Icone: Briefcase, teinte: "bg-ciel text-primaire" },
  aucun_horaire: { Icone: CalendarX2, teinte: "bg-canevas text-texte-secondaire" },
  en_cours: { Icone: Briefcase, teinte: "bg-succes/10 text-succes" },
  pas_encore_pointe: { Icone: Hourglass, teinte: "bg-canevas text-texte-secondaire" },
};

/** Statut de la journée en une étiquette (icône + mot, jamais la couleur seule), avec le retard en minutes. */
export function StatutJour({ jour }: { jour: JourDetail }) {
  const statut = statutJourDetail(jour, jour.jour === jourDansFuseau(new Date(), FUSEAU_HORAIRE));
  const { Icone, teinte } = STATUTS[statut];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-sm font-medium", teinte)}>
      <Icone className="size-4 shrink-0" aria-hidden="true" />
      {textes.statuts[statut]}
      {statut === "retard" && jour.retardMinutes !== null && <span className="font-normal tabular-nums">{textes.retardDe(formaterMinutes(jour.retardMinutes))}</span>}
    </span>
  );
}

const HEURE ="rounded-md bg-surface px-1.5 py-0.5 font-medium text-texte tabular-nums ring-1 ring-bordure";

/** Profil du jour (code), ou « Repos » (« Aucun horaire » sans affectation) avec une icône. */
export function HoraireJour({ jour }: { jour: JourDetail }) {
  const Icone = jour.estSansPlanning ? CalendarX2 : Moon;
  return jour.profilCode === null ? (
    <span className="inline-flex items-center gap-1.5 text-texte-secondaire">
      <Icone className="size-4 shrink-0" aria-hidden="true" />
      {jour.estSansPlanning ? textes.aucunHoraire : textes.repos}
    </span>
  ) : (
    <span className="rounded-md bg-ciel px-2 py-0.5 font-mono text-sm font-semibold text-marine ring-1 ring-primaire/15">{jour.profilCode}</span>
  );
}

/** Entrée et sortie retenues (« 08:15 → 17:00 »), sortie manquante signalée par une icône et un texte. */
export function PresenceJour({ jour }: { jour: JourDetail }) {
  if (jour.entree === null) return <span className="text-texte-secondaire">{textes.aucun}</span>;
  const entree = minutesVersHeure(jour.entree);
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className={HEURE}>{entree}</span>
      <ArrowRight className="size-3.5 shrink-0 text-texte-secondaire" aria-hidden="true" />
      <span className="sr-only">{textes.jusqua}</span>
      {jour.sortie === null && jour.jour === jourDansFuseau(new Date(), FUSEAU_HORAIRE) ? (
        <span className="text-texte-secondaire">{textes.sortieEnCours}</span>
      ) : jour.sortie === null ? (
        <span className="inline-flex items-center gap-1 rounded-md bg-attention/10 px-1.5 py-0.5 text-attention">
          <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          {textes.sortieManquante}
        </span>
      ) : (
        <span className={HEURE}>{minutesVersHeure(jour.sortie)}</span>
      )}
    </span>
  );
}

/** Durée en minutes lisible, ou un tiret discret si elle est inconnue. */
export const DureeJour = ({ minutes }: { minutes: number | null }) =>
  minutes === null ? <span className="text-texte-secondaire">-</span> : <span className="tabular-nums">{formaterMinutes(minutes)}</span>;

/** Événement retenu (code, icône et type), puis les événements non validés de la journée. */
export function EvenementJour({ jour }: { jour: JourDetail }) {
  const { evenement, nonValides } = jour;
  if (!evenement && nonValides.length === 0) return <span className="text-texte-secondaire">-</span>;
  const Icone = evenement?.type === "presence" ? Plane : CalendarX2;
  return (
    <span className="flex flex-col gap-0.5">
      {evenement && (
        <span className="flex items-center gap-1.5 whitespace-nowrap" title={evenement.nom}>
          <Icone className="size-4 shrink-0 text-attention" aria-hidden="true" />
          <span className="font-mono font-semibold text-texte">{evenement.code}</span>
          <span className="truncate text-texte-secondaire">{evenement.nom}</span>
        </span>
      )}
      {nonValides.length > 0 && (
        <span className="text-sm text-texte-secondaire" title={textes.nonValides(nonValides.map((element) => element.nom).join(", "))}>
          <span className="font-mono line-through">{nonValides.map((element) => element.code).join(", ")}</span> ({textes.nonValide})
        </span>
      )}
    </span>
  );
}
