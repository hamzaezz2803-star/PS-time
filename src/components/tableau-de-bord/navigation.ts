import {
  Briefcase,
  Building2,
  CalendarClock,
  CalendarCog,
  CalendarRange,
  ClipboardClock,
  ClockAlert,
  Factory,
  LayoutDashboard,
  Repeat,
  UserRound,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import {
  CHEMIN_AFFECTATIONS,
  CHEMIN_CALENDRIERS,
  CHEMIN_DEPARTEMENTS,
  CHEMIN_ESPACE,
  CHEMIN_GROUPES,
  CHEMIN_PERSONNES,
  CHEMIN_POINTAGES_MANUELS,
  CHEMIN_POSTES,
  CHEMIN_ROTATIONS,
  CHEMIN_SITES,
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
          // Ordre de saisie : un site, ses départements, ses postes, puis ses employés.
          { libelle: T.sites, icone: Factory, href: CHEMIN_SITES },
          { libelle: T.departements, icone: Building2, href: CHEMIN_DEPARTEMENTS },
          { libelle: T.postes, icone: Briefcase, href: CHEMIN_POSTES },
          { libelle: T.personnes, icone: UserRound, href: CHEMIN_PERSONNES },
        ],
      },
    ],
  },
  {
    titre: T.groupeProgramme,
    elements: [
      {
        libelle: T.programme,
        icone: CalendarCog,
        sousLiens: [
          { libelle: T.calendriers, icone: CalendarClock, href: CHEMIN_CALENDRIERS },
          { libelle: T.rotations, icone: Repeat, href: CHEMIN_ROTATIONS },
          { libelle: T.groupes, icone: UsersRound, href: CHEMIN_GROUPES },
          { libelle: T.affectations, icone: CalendarRange, href: CHEMIN_AFFECTATIONS },
        ],
      },
    ],
  },
  {
    titre: T.groupePresence,
    elements: [
      {
        libelle: T.gestionExceptions,
        icone: ClockAlert,
        sousLiens: [{ libelle: T.pointagesManuels, icone: ClipboardClock, href: CHEMIN_POINTAGES_MANUELS }],
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
