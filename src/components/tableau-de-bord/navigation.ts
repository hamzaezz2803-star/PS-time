import {
  Briefcase,
  Building2,
  CalendarClock,
  CalendarCog,
  CalendarRange,
  CalendarSearch,
  ClipboardClock,
  ClockAlert,
  ClockArrowUp,
  Factory,
  FileClock,
  History,
  LayoutDashboard,
  ListChecks,
  Palette,
  Repeat,
  ShieldCheck,
  UserRound,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import {
  CHEMIN_AFFECTATIONS,
  CHEMIN_APPARENCE,
  CHEMIN_COMPTEURS,
  CHEMIN_DEPARTEMENTS,
  CHEMIN_DETAIL_JOUR,
  CHEMIN_ESPACE,
  CHEMIN_GROUPES,
  CHEMIN_HISTORIQUE,
  CHEMIN_HORAIRE_DYNAMIQUE,
  CHEMIN_PERSONNES,
  CHEMIN_POINTAGES_MANUELS,
  CHEMIN_POSTES,
  CHEMIN_PROFILS_HORAIRES,
  CHEMIN_RAPPORT_PRESENCES,
  CHEMIN_ROTATIONS,
  CHEMIN_SITES,
  CHEMIN_UTILISATEURS,
} from "@/lib/constantes";
import { peutAcceder, type Droits, type Page } from "@/lib/metier/droits";
import { TEXTES_NAVIGATION as T } from "@/lib/textes/navigation";

/** Une page du menu. Visible si sa `page` est accordée, ou réservée au super administrateur. */
export type LienNavigation = {
  libelle: string;
  icone: LucideIcon;
  href: string;
  page?: Page;
  reserveSuperAdmin?: boolean;
};

/** Bloc d'un menu déroulant, avec un intertitre facultatif (ex. « Compteurs »). */
export type SectionNavigation = { titre?: string; liens: LienNavigation[] };

/** Entrée de la barre : lien direct (`href`) ou menu déroulant (`sections`). */
export type MenuNavigation = {
  libelle: string;
  icone: LucideIcon;
  href?: string;
  sections?: SectionNavigation[];
};

export const MENUS_NAVIGATION: MenuNavigation[] = [
  { libelle: T.tableauDeBord, icone: LayoutDashboard, href: CHEMIN_ESPACE },
  {
    libelle: T.personnel,
    icone: Users,
    sections: [
      {
        // Ordre de saisie : un site, ses départements, ses postes, puis ses employés.
        liens: [
          { libelle: T.sites, icone: Factory, href: CHEMIN_SITES, page: "sites" },
          { libelle: T.departements, icone: Building2, href: CHEMIN_DEPARTEMENTS, page: "departements" },
          { libelle: T.postes, icone: Briefcase, href: CHEMIN_POSTES, page: "postes" },
          { libelle: T.personnes, icone: UserRound, href: CHEMIN_PERSONNES, page: "personnes" },
        ],
      },
    ],
  },
  {
    libelle: T.planning,
    icone: CalendarCog,
    sections: [
      {
        liens: [
          { libelle: T.profilsHoraires, icone: CalendarClock, href: CHEMIN_PROFILS_HORAIRES, page: "profils_horaires" },
          { libelle: T.rotations, icone: Repeat, href: CHEMIN_ROTATIONS, page: "rotations" },
          { libelle: T.groupes, icone: UsersRound, href: CHEMIN_GROUPES, page: "groupes" },
          { libelle: T.affectations, icone: CalendarRange, href: CHEMIN_AFFECTATIONS, page: "affectations" },
          { libelle: T.horaireDynamique, icone: ClockArrowUp, href: CHEMIN_HORAIRE_DYNAMIQUE, page: "horaire_dynamique" },
          { libelle: T.rapportPresences, icone: FileClock, href: CHEMIN_RAPPORT_PRESENCES, page: "rapport_presences" },
        ],
      },
    ],
  },
  {
    libelle: T.presence,
    icone: ClockAlert,
    sections: [
      {
        titre: T.gestionExceptions,
        liens: [{ libelle: T.pointagesManuels, icone: ClipboardClock, href: CHEMIN_POINTAGES_MANUELS, page: "pointages_manuels" }],
      },
      {
        titre: T.compteurs,
        liens: [
          { libelle: T.gestionCompteurs, icone: ListChecks, href: CHEMIN_COMPTEURS, page: "compteurs" },
          { libelle: T.detailJour, icone: CalendarSearch, href: CHEMIN_DETAIL_JOUR, page: "detail_jour" },
        ],
      },
    ],
  },
  {
    libelle: T.administration,
    icone: ShieldCheck,
    sections: [
      {
        liens: [
          { libelle: T.utilisateurs, icone: ShieldCheck, href: CHEMIN_UTILISATEURS, reserveSuperAdmin: true },
          { libelle: T.historique, icone: History, href: CHEMIN_HISTORIQUE, reserveSuperAdmin: true },
          { libelle: T.apparence, icone: Palette, href: CHEMIN_APPARENCE, reserveSuperAdmin: true },
        ],
      },
    ],
  },
];

function lienVisible(lien: LienNavigation, droits: Droits): boolean {
  if (lien.reserveSuperAdmin) return droits.estSuperAdmin;
  return lien.page ? peutAcceder(droits, lien.page) : true;
}

/** Menus que ce compte peut voir, sans les pages non accordées (la vraie vérification reste faite par chaque page). */
export function menusVisibles(droits: Droits): MenuNavigation[] {
  return MENUS_NAVIGATION.flatMap((menu) => {
    if (!menu.sections) return [menu];
    const sections = menu.sections
      .map((section) => ({ ...section, liens: section.liens.filter((lien) => lienVisible(lien, droits)) }))
      .filter((section) => section.liens.length > 0);
    return sections.length > 0 ? [{ ...menu, sections }] : [];
  });
}

/** Vrai si le chemin affiché est cette page (ou une de ses sous-pages). */
export const estLienActif = (href: string, chemin: string) => chemin === href || chemin.startsWith(`${href}/`);

/** Libellés du fil d'Ariane pour un chemin : menu, intertitre éventuel, puis page (ex. Présence, Compteurs, Détail jour). */
export function cheminVersFilAriane(chemin: string): string[] {
  for (const menu of MENUS_NAVIGATION) {
    if (menu.href && chemin === menu.href) return [menu.libelle];
    for (const section of menu.sections ?? []) {
      const lien = section.liens.find((candidat) => estLienActif(candidat.href, chemin));
      if (lien) return [menu.libelle, ...(section.titre ? [section.titre] : []), lien.libelle];
    }
  }
  return [];
}
