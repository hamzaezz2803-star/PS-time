import Link from "next/link";
import type { ReactNode } from "react";
import { Asterisk } from "lucide-react";
import { CHEMIN_DETAIL_JOUR } from "@/lib/constantes";
import { formaterJour } from "@/lib/formats";
import type { JourPlanning } from "@/lib/metier/planning-consultation";
import { TEXTES_PLANNING } from "@/lib/textes/planning";
import { cn } from "@/lib/utils";

const textes = TEXTES_PLANNING;

/** Couleurs d'une case selon ce qui est retenu ce jour-là (palette fixe, contrastes vérifiés). */
export function couleursDuJour(jour: JourPlanning): string {
  if (jour.evenement?.type === "absence") return "bg-regle-orange-fond text-regle-orange";
  if (jour.evenement?.type === "presence") return "bg-regle-turquoise-fond text-regle-turquoise";
  if (!jour.profilCode && jour.estSansPlanning) return "bg-canevas text-texte-secondaire";
  if (!jour.profilCode) return "bg-regle-vert-fond text-regle-vert";
  return "bg-surface text-marine";
}

/** Ce qu'affiche une case sans code : « Repos », ou « Aucun horaire » sans affectation. */
export const libelleSansCode = (jour: JourPlanning): string => (jour.estSansPlanning ? textes.aucunHoraire : textes.repos);

/** Info-bulle d'une case : date, code et libellé, anomalies et événements non validés. */
export function infoBulleDuJour(jour: JourPlanning): string {
  const quoi = jour.evenement ? `${jour.evenement.code} : ${jour.evenement.nom}` : (jour.profilCode ?? libelleSansCode(jour));
  return [
    `${formaterJour(jour.jour)} · ${quoi}`,
    ...jour.anomalies.map((anomalie) => textes.anomalies[anomalie]),
    jour.aEvenementEnHeures ? textes.evenementEnHeures : null,
    jour.nonValides.length > 0 ? textes.nonValides(jour.nonValides.map((evenement) => evenement.code).join(", ")) : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Étoile rouge des anomalies (comme dans Gestor), avec leur nom pour les lecteurs d'écran. */
export function MarqueAnomalie({ jour, className }: { jour: JourPlanning; className?: string }) {
  if (jour.anomalies.length === 0) return null;
  return (
    <span className={cn("inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-erreur text-white", className)}>
      <Asterisk className="size-3.5" aria-hidden="true" />
      <span className="sr-only">{`${textes.anomalies.titre} : ${jour.anomalies.map((anomalie) => textes.anomalies[anomalie]).join(", ")}`}</span>
    </span>
  );
}

/** Case cliquable vers le Détail jour (jour passé ou aujourd'hui, page accordée), sinon simple bloc. */
export function LienJour({ jour, employeId, peutOuvrir, className, children }: { jour: JourPlanning; employeId: string; peutOuvrir: boolean; className?: string; children: ReactNode }) {
  const titre = infoBulleDuJour(jour);
  if (!peutOuvrir || jour.estFutur) {
    return (
      <div className={className} title={titre}>
        {children}
      </div>
    );
  }
  return (
    <Link
      href={`${CHEMIN_DETAIL_JOUR}?employe=${employeId}&date=${jour.jour}`}
      title={titre}
      aria-label={`${textes.voirJour(formaterJour(jour.jour))}. ${titre.replaceAll("\n", ". ")}`}
      className={cn(className, "transition-shadow duration-150 hover:shadow-survol focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire")}
    >
      {children}
    </Link>
  );
}
