import {
  Briefcase,
  Building2,
  LayoutDashboard,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { CHEMIN_DEPARTEMENTS, CHEMIN_ESPACE } from "@/lib/constantes";
import { TEXTES_NAVIGATION as T } from "@/lib/textes/navigation";

/** Sans `href` : fonctionnalité pas encore développée, affichée « Bientôt » et non cliquable. */
export type LienNavigation = {
  libelle: string;
  icone: LucideIcon;
  href?: string;
};

export type SectionNavigation = LienNavigation & {
  liens?: LienNavigation[];
};

export const SECTIONS_NAVIGATION: SectionNavigation[] = [
  { libelle: T.tableauDeBord, icone: LayoutDashboard, href: CHEMIN_ESPACE },
  {
    libelle: T.personnel,
    icone: Users,
    liens: [
      { libelle: T.personnes, icone: UserRound },
      { libelle: T.departements, icone: Building2, href: CHEMIN_DEPARTEMENTS },
      { libelle: T.postes, icone: Briefcase },
    ],
  },
];
