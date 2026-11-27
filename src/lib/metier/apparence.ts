/**
 * Apparence de l'application (thème de couleurs, couleurs personnalisées, police, taille du
 * texte, menus, densité des tableaux, couleurs d'impression), choisie par le super administrateur. Fonctions pures, testées dans apparence.test.ts.
 */
import {
  COULEURS_PERSONNALISABLES,
  COULEURS_PERSONNALISEES_PAR_DEFAUT,
  DENSITES,
  DENSITE_PAR_DEFAUT,
  MODES_IMPRESSION,
  MODES_MENU,
  MODE_IMPRESSION_PAR_DEFAUT,
  MODE_MENU_PAR_DEFAUT,
  POLICES,
  POLICE_PAR_DEFAUT,
  TAILLES_TEXTE,
  TAILLE_TEXTE_PAR_DEFAUT,
  THEMES,
  THEME_PAR_DEFAUT,
} from "../constantes.ts";
import { normaliserCouleur, sontLisibles, type CouleursPersonnalisees } from "./couleurs.ts";

export type Theme = (typeof THEMES)[number];
export type Police = (typeof POLICES)[number];
export type TailleTexte = (typeof TAILLES_TEXTE)[number];
export type ModeMenu = (typeof MODES_MENU)[number];
export type Densite = (typeof DENSITES)[number];
export type ModeImpression = (typeof MODES_IMPRESSION)[number];
export type Apparence = {
  theme: Theme;
  police: Police;
  taille: TailleTexte;
  couleurs: CouleursPersonnalisees;
  menu: ModeMenu;
  densite: Densite;
  impression: ModeImpression;
};

export const APPARENCE_PAR_DEFAUT: Apparence = {
  theme: THEME_PAR_DEFAUT,
  police: POLICE_PAR_DEFAUT,
  taille: TAILLE_TEXTE_PAR_DEFAUT,
  couleurs: { ...COULEURS_PERSONNALISEES_PAR_DEFAUT },
  menu: MODE_MENU_PAR_DEFAUT,
  densite: DENSITE_PAR_DEFAUT,
  impression: MODE_IMPRESSION_PAR_DEFAUT,
};

const dansListe = <T extends string>(liste: readonly T[]) => (valeur: string): valeur is T => (liste as readonly string[]).includes(valeur);
export const estTheme = dansListe(THEMES);
export const estPolice = dansListe(POLICES);
export const estTailleTexte = dansListe(TAILLES_TEXTE);
export const estModeMenu = dansListe(MODES_MENU);
export const estDensite = dansListe(DENSITES);
export const estModeImpression = dansListe(MODES_IMPRESSION);

/** Clé du réglage qui garde chaque couleur personnalisée (ex. `couleur_primaire`). */
export const cleCouleur = (couleur: (typeof COULEURS_PERSONNALISABLES)[number]) => `couleur_${couleur}`;

/** Réglages à enregistrer pour une apparence (une ligne par clé dans `parametres`). */
export function reglagesDepuisApparence(apparence: Apparence): { cle: string; valeur: string }[] {
  return [
    { cle: "theme", valeur: apparence.theme },
    { cle: "police", valeur: apparence.police },
    { cle: "taille_texte", valeur: apparence.taille },
    { cle: "menu", valeur: apparence.menu },
    { cle: "densite", valeur: apparence.densite },
    { cle: "impression", valeur: apparence.impression },
    ...COULEURS_PERSONNALISABLES.map((couleur) => ({ cle: cleCouleur(couleur), valeur: apparence.couleurs[couleur] })),
  ];
}

/**
 * Apparence lue dans les réglages enregistrés : une valeur absente ou inconnue garde le choix
 * par défaut ; des couleurs personnalisées illisibles ramènent au thème par défaut.
 */
export function apparenceDepuisReglages(reglages: readonly { cle: string; valeur: string }[]): Apparence {
  const valeur = (cle: string) => reglages.find((reglage) => reglage.cle === cle)?.valeur ?? "";
  const theme = valeur("theme");
  const police = valeur("police");
  const taille = valeur("taille_texte");
  const menu = valeur("menu");
  const densite = valeur("densite");
  const impression = valeur("impression");
  const couleurs = Object.fromEntries(
    COULEURS_PERSONNALISABLES.map((couleur) => [couleur, normaliserCouleur(valeur(cleCouleur(couleur))) ?? COULEURS_PERSONNALISEES_PAR_DEFAUT[couleur]]),
  ) as CouleursPersonnalisees;
  const themeLu = estTheme(theme) ? theme : APPARENCE_PAR_DEFAUT.theme;
  return {
    theme: themeLu === "personnalise" && !sontLisibles(couleurs) ? APPARENCE_PAR_DEFAUT.theme : themeLu,
    police: estPolice(police) ? police : APPARENCE_PAR_DEFAUT.police,
    taille: estTailleTexte(taille) ? taille : APPARENCE_PAR_DEFAUT.taille,
    couleurs,
    menu: estModeMenu(menu) ? menu : APPARENCE_PAR_DEFAUT.menu,
    densite: estDensite(densite) ? densite : APPARENCE_PAR_DEFAUT.densite,
    impression: estModeImpression(impression) ? impression : APPARENCE_PAR_DEFAUT.impression,
  };
}
