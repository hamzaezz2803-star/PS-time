import {
  Briefcase,
  Building2,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Eye,
  CalendarRange,
  CalendarSearch,
  CalendarX2,
  ClipboardClock,
  ClipboardList,
  FileBarChart,
  ClockAlert,
  ClockArrowUp,
  DatabaseBackup,
  Factory,
  FileClock,
  Fingerprint,
  History,
  LayoutDashboard,
  ListChecks,
  Palette,
  Repeat,
  ScanLine,
  ShieldCheck,
  UserRound,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import {
  CHEMIN_AFFECTATIONS,
  CHEMIN_APPAREILS,
  CHEMIN_APPARENCE,
  CHEMIN_SAUVEGARDE,
  CHEMIN_COMPTEURS,
  CHEMIN_DEPARTEMENTS,
  CHEMIN_DETAIL_JOUR,
  CHEMIN_DROITS_CONGES,
  CHEMIN_ESPACE,
  CHEMIN_ETAT,
  CHEMIN_EVENEMENTS,
  CHEMIN_GROUPES,
  CHEMIN_HISTORIQUE,
  CHEMIN_HORAIRE_DYNAMIQUE,
  CHEMIN_PERSONNES,
  CHEMIN_PLANNING_VUE,
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
  description: string;
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
          { libelle: T.sites, description: T.descriptions.sites, icone: Factory, href: CHEMIN_SITES, page: "sites" },
          { libelle: T.departements, description: T.descriptions.departements, icone: Building2, href: CHEMIN_DEPARTEMENTS, page: "departements" },
          { libelle: T.postes, description: T.descriptions.postes, icone: Briefcase, href: CHEMIN_POSTES, page: "postes" },
          { libelle: T.personnes, description: T.descriptions.personnes, icone: UserRound, href: CHEMIN_PERSONNES, page: "personnes" },
        ],
      },
    ],
  },
  {
    // Sur le modèle de Gestor : Consultation > Planning, puis le paramétrage du programme.
    libelle: T.consultation,
    icone: Eye,
    sections: [
      {
        titre: T.planning,
        liens: [
          { libelle: T.planningMensuel, description: T.descriptions.planningMensuel, icone: CalendarDays, href: CHEMIN_PLANNING_VUE("mensuel"), page: "planning" },
          { libelle: T.planningAnnuel, description: T.descriptions.planningAnnuel, icone: CalendarRange, href: CHEMIN_PLANNING_VUE("annuel"), page: "planning" },
        ],
      },
      {
        titre: T.programme,
        liens: [
          { libelle: T.profilsHoraires, description: T.descriptions.profilsHoraires, icone: CalendarClock, href: CHEMIN_PROFILS_HORAIRES, page: "profils_horaires" },
          { libelle: T.rotations, description: T.descriptions.rotations, icone: Repeat, href: CHEMIN_ROTATIONS, page: "rotations" },
          { libelle: T.groupes, description: T.descriptions.groupes, icone: UsersRound, href: CHEMIN_GROUPES, page: "groupes" },
          { libelle: T.affectations, description: T.descriptions.affectations, icone: CalendarRange, href: CHEMIN_AFFECTATIONS, page: "affectations" },
          { libelle: T.horaireDynamique, description: T.descriptions.horaireDynamique, icone: ClockArrowUp, href: CHEMIN_HORAIRE_DYNAMIQUE, page: "horaire_dynamique" },
          { libelle: T.rapportPresences, description: T.descriptions.rapportPresences, icone: FileClock, href: CHEMIN_RAPPORT_PRESENCES, page: "rapport_presences" },
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
        liens: [
          { libelle: T.pointagesManuels, description: T.descriptions.pointagesManuels, icone: ClipboardClock, href: CHEMIN_POINTAGES_MANUELS, page: "pointages_manuels" },
          { libelle: T.evenements, description: T.descriptions.evenements, icone: CalendarX2, href: CHEMIN_EVENEMENTS, page: "evenements" },
        ],
      },
      {
        titre: T.compteurs,
        liens: [{ libelle: T.detailJour, description: T.descriptions.detailJour, icone: CalendarSearch, href: CHEMIN_DETAIL_JOUR, page: "detail_jour" }],
      },
    ],
  },
  {
    libelle: T.etats,
    icone: FileBarChart,
    sections: [
      {
        liens: [
          { libelle: T.etatPresences, description: T.descriptions.etatPresences, icone: ClockAlert, href: CHEMIN_ETAT("presences"), page: "etat_presences" },
          { libelle: T.etatEvenements, description: T.descriptions.etatEvenements, icone: CalendarX2, href: CHEMIN_ETAT("evenements"), page: "etat_evenements" },
          { libelle: T.etatConges, description: T.descriptions.etatConges, icone: CalendarCheck, href: CHEMIN_ETAT("conges"), page: "etat_conges" },
          { libelle: T.etatPointages, description: T.descriptions.etatPointages, icone: ClipboardList, href: CHEMIN_ETAT("pointages-manuels"), page: "etat_pointages" },
        ],
      },
    ],
  },
  {
    libelle: T.appareils,
    icone: Fingerprint,
    sections: [{ liens: [{ libelle: T.badgeuses, description: T.descriptions.badgeuses, icone: ScanLine, href: CHEMIN_APPAREILS, reserveSuperAdmin: true }] }],
  },
  {
    libelle: T.administration,
    icone: ShieldCheck,
    sections: [
      {
        // Chaque page garde son propre droit : un administrateur ne voit que celles qui lui sont accordées.
        titre: T.congesEtCompteurs,
        liens: [
          { libelle: T.droitsConges, description: T.descriptions.droitsConges, icone: CalendarCheck, href: CHEMIN_DROITS_CONGES, page: "droits_conges" },
          { libelle: T.gestionCompteurs, description: T.descriptions.gestionCompteurs, icone: ListChecks, href: CHEMIN_COMPTEURS, page: "compteurs" },
        ],
      },
      {
        titre: T.systeme,
        liens: [
          { libelle: T.utilisateurs, description: T.descriptions.utilisateurs, icone: ShieldCheck, href: CHEMIN_UTILISATEURS, reserveSuperAdmin: true },
          { libelle: T.historique, description: T.descriptions.historique, icone: History, href: CHEMIN_HISTORIQUE, reserveSuperAdmin: true },
          { libelle: T.apparence, description: T.descriptions.apparence, icone: Palette, href: CHEMIN_APPARENCE, reserveSuperAdmin: true },
          { libelle: T.sauvegarde, description: T.descriptions.sauvegarde, icone: DatabaseBackup, href: CHEMIN_SAUVEGARDE, reserveSuperAdmin: true },
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

/** Menus dans la barre à partir de 1280 px (1536 px avec le texte très grand) ; tiroir en dessous. */
export const MENUS_VISIBLES = "hidden xl:block in-data-[taille=tres_grande]:max-2xl:hidden";
export const TIROIR_VISIBLE = "xl:hidden in-data-[taille=tres_grande]:max-2xl:block";
