import { CalendarX2, Plane } from "lucide-react";
import { formaterMinutes } from "@/lib/metier/compteurs/format";
import { minutesVersHeure } from "@/lib/metier/programme";
import { TEXTES_DETAIL_JOUR } from "@/lib/textes/detail-jour";
import type { JourDetail } from "@/types";

const textes = TEXTES_DETAIL_JOUR.jour;

/** Profil du jour (code), ou « Repos ». */
export function HoraireJour({ jour }: { jour: JourDetail }) {
  return jour.profilCode === null ? (
    <span className="text-texte-secondaire">{textes.repos}</span>
  ) : (
    <span className="rounded-md bg-ciel px-1.5 py-0.5 font-mono text-sm font-semibold text-marine">{jour.profilCode}</span>
  );
}

/** Entrée et sortie retenues (« 08:15 à 17:00 »), sortie manquante signalée. */
export function PresenceJour({ jour }: { jour: JourDetail }) {
  if (jour.entree === null) return <span className="text-texte-secondaire">{textes.aucun}</span>;
  return (
    <span className="whitespace-nowrap tabular-nums">
      {jour.sortie === null ? (
        <>
          {minutesVersHeure(jour.entree)}, <span className="text-attention">{textes.sortieManquante}</span>
        </>
      ) : (
        textes.entreeSortie(minutesVersHeure(jour.entree), minutesVersHeure(jour.sortie))
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
