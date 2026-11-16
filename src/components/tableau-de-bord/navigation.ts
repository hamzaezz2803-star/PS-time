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
  ShieldCheck,
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
  CHEMIN_UTILISATEURS,
} from "@/lib/constantes";
import { peutGerer, type Droits, type Module } from "@/lib/metier/droits";
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
  /** Module requis pour voir le groupe (absent : visible par tous). */
  module?: Module;
  /** Vrai : visible seulement par un super administrateur (gestion des utilisateurs). */
  reserveSuperAdmin?: boolean;
};

export const GROUPES_NAVIGATION: GroupeNavigation[] = [
  {
    titre: T.groupeGeneral,
    elements: [{ libelle: T.tableauDeBord, icone: LayoutDashboard, href: CHEMIN_ESPACE }],
  },
  {
    titre: T.groupePersonnel,
    module: "personnel",
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
    module: "planning",
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
    module: "presence",
    elements: [
      {
        libelle: T.gestionExceptions,
        icone: ClockAlert,
        sousLiens: [{ libelle: T.pointagesManuels, icone: ClipboardClock, href: CHEMIN_POINTAGES_MANUELS }],
      },
    ],
  },
  {
    titre: T.groupeAdministration,
    reserveSuperAdmin: true,
    elements: [{ libelle: T.utilisateurs, icone: ShieldCheck, href: CHEMIN_UTILISATEURS }],
  },
];

/** Groupes du menu que ce compte peut voir (la vraie vérification reste faite par chaque page). */
export function groupesVisibles(droits: Droits): GroupeNavigation[] {
  return GROUPES_NAVIGATION.filter((groupe) => {
    if (groupe.reserveSuperAdmin) return droits.estSuperAdmin;
    return groupe.module ? peutGerer(droits, groupe.module) : true;
  });
}

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
