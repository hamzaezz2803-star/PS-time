import { CircleAlert, CircleCheck, CircleHelp, Clock4, MoonStar, type LucideIcon } from "lucide-react";
import { Pastille } from "@/components/ui/pastille";
import type { CodeStatut, StatutPointage } from "@/lib/metier/statut-pointage";
import { libelleService, libelleStatut, TEXTES_STATUT_POINTAGE } from "@/lib/textes/statut-pointage";

type Ton = "succes" | "info" | "attention" | "neutre";

/** Couleur et icône de chaque statut : le libellé dit toujours le résultat (jamais la couleur seule). */
const APPARENCE: Record<CodeStatut, { ton: Ton; Icone: LucideIcon }> = {
  a_l_heure: { ton: "succes", Icone: CircleCheck },
  conforme: { ton: "succes", Icone: CircleCheck },
  retard_tolere: { ton: "info", Icone: Clock4 },
  retard: { ton: "attention", Icone: CircleAlert },
  depart_anticipe: { ton: "attention", Icone: CircleAlert },
  pause_anticipee: { ton: "attention", Icone: CircleAlert },
  retour_pause_retard: { ton: "attention", Icone: CircleAlert },
  plage_interdite: { ton: "attention", Icone: CircleAlert },
  plage_neutralisee: { ton: "attention", Icone: CircleAlert },
  pause_non_prevue: { ton: "attention", Icone: CircleAlert },
  non_badge: { ton: "neutre", Icone: CircleHelp },
  jour_repos: { ton: "neutre", Icone: MoonStar },
  aucun_planning: { ton: "neutre", Icone: CircleHelp },
};

/** Résultat d'un pointage comparé au profil horaire, avec le profil et l'heure validée en dessous. */
export function ResultatPointage({ statut }: { statut: StatutPointage }) {
  const { ton, Icone } = APPARENCE[statut.code];
  const service = libelleService(statut);
  const explication = TEXTES_STATUT_POINTAGE.explications[statut.code];
  return (
    <span className="flex flex-col items-start gap-1" title={explication}>
      <Pastille ton={ton} Icone={Icone}>{libelleStatut(statut)}</Pastille>
      {service && <span className="text-sm text-texte-secondaire tabular-nums">{service}</span>}
    </span>
  );
}
