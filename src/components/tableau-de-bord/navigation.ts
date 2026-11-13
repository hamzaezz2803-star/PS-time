import {
  Briefcase,
  Building2,
  LayoutDashboard,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  CHEMIN_DEPARTEMENTS,
  CHEMIN_ESPACE,
  CHEMIN_PERSONNES,
  CHEMIN_POSTES,
} from "@/lib/constantes";
import { TEXTES_NAVIGATION as T } from "@/lib/textes/navigation";

/** Sans `href` : fonctionnalité pas encore développée, affichée « Bientôt » et non cliquable. */
export type LienNavigation = {
  libelle: string;
  icone: LucideIcon;
  href?: string;
};

export type ElementNavigation = LienNavigation & {
  sousLiens?: LienNavigation[];
};

export type GroupeNavigation = {
  titre: string;
  elements: ElementNavigation[];
};

export const GROUPES_NAVIGATION: GroupeNavigation[] = [
  {
    titre: T.groupeGeneral,
    elements: [{ libelle: T.tableauDeBord, icone: LayoutDashboard, href: CHEMIN_ESPACE }],
  },
  {
    titre: T.groupePersonnel,
    elements: [
      {
        libelle: T.personnel,
        icone: Users,
        sousLiens: [
          { libelle: T.personnes, icone: UserRound, href: CHEMIN_PERSONNES },
          { libelle: T.departements, icone: Building2, href: CHEMIN_DEPARTEMENTS },
          { libelle: T.postes, icone: Briefcase, href: CHEMIN_POSTES },
        ],
      },
    ],
  },
];

/** Libellés du fil d'Ariane pour un chemin : groupe puis page (ex. Personnel, Départements). */
export function cheminVersFilAriane(chemin: string): string[] {
  for (const groupe of GROUPES_NAVIGATION) {
    for (const element of groupe.elements) {
      if (element.href && chemin === element.href) return [element.libelle];
      const sousLien = element.sousLiens?.find(
        (lien) => lien.href && chemin.startsWith(lien.href),
      );
      if (sousLien) return [element.libelle, sousLien.libelle];
    }
  }
  return [];
}
