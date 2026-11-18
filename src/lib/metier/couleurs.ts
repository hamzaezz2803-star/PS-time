/**
 * Couleurs du thème « Personnalisé » : lecture d'une couleur, nuances déduites et contrôle de
 * lisibilité (contraste WCAG). Fonctions pures, testées dans couleurs.test.ts.
 */
import { COULEUR_TEXTE_SECONDAIRE, CONTRASTE_MIN_TEXTE, type COULEURS_PERSONNALISABLES } from "../constantes.ts";

export type CouleurPersonnalisable = (typeof COULEURS_PERSONNALISABLES)[number];
export type CouleursPersonnalisees = Record<CouleurPersonnalisable, string>;

/** Couleur au format `#rrggbb` (minuscules), seul format accepté et enregistré. */
export const FORMAT_COULEUR = /^#[0-9a-f]{6}$/;

const BLANC = "#ffffff";
const NOIR = "#000000";
/** Part de la couleur d'origine gardée pour chaque nuance déduite. */
const PART_SURVOL = 0.8;
const PART_CIEL = 0.1;
const PART_CANEVAS = 0.96;

/** Couleur saisie remise au format `#rrggbb`, ou null si elle n'est pas valide. */
export function normaliserCouleur(saisie: string): string | null {
  const couleur = saisie.trim().toLowerCase();
  return FORMAT_COULEUR.test(couleur) ? couleur : null;
}

function composantes(couleur: string): [number, number, number] {
  return [1, 3, 5].map((debut) => Number.parseInt(couleur.slice(debut, debut + 2), 16)) as [number, number, number];
}

/** Mélange deux couleurs : `part` de la première (0 à 1), le reste de la seconde. */
export function melanger(couleur: string, autre: string, part: number): string {
  const [a, b] = [composantes(couleur), composantes(autre)];
  return `#${a.map((valeur, rang) => Math.round(valeur * part + b[rang] * (1 - part)).toString(16).padStart(2, "0")).join("")}`;
}

function luminance(couleur: string): number {
  const [r, v, b] = composantes(couleur).map((valeur) => {
    const canal = valeur / 255;
    return canal <= 0.03928 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * v + 0.0722 * b;
}

/** Rapport de contraste entre deux couleurs (1 à 21), comme les outils WCAG. */
export function contraste(couleur: string, autre: string): number {
  const [claire, sombre] = [luminance(couleur), luminance(autre)].sort((x, y) => y - x);
  return (claire + 0.05) / (sombre + 0.05);
}

/** Toutes les nuances du thème, déduites des quatre couleurs choisies. */
export function deriverPalette(couleurs: CouleursPersonnalisees) {
  return {
    primaire: couleurs.primaire,
    "primaire-survol": melanger(couleurs.primaire, NOIR, PART_SURVOL),
    marine: couleurs.marine,
    accent: couleurs.accent,
    ciel: melanger(couleurs.primaire, BLANC, PART_CIEL),
    fond: couleurs.fond,
    canevas: melanger(couleurs.fond, couleurs.marine, PART_CANEVAS),
  };
}

/** Variables CSS du thème personnalisé, posées sur <html> (elles remplacent celles de globals.css). */
export function variablesCouleurs(couleurs: CouleursPersonnalisees): Record<string, string> {
  return Object.fromEntries(Object.entries(deriverPalette(couleurs)).map(([nom, valeur]) => [`--couleur-${nom}`, valeur]));
}

export type ControleContraste = { couleur: CouleurPersonnalisable; ratio: number; estLisible: boolean };

/**
 * Lisibilité de chaque couleur dans ses usages les plus exigeants : texte et boutons primaires
 * sur le fond bleuté (ciel), titres sur ce même fond, texte secondaire sur le fond des pages.
 * L'accent n'est que décoratif : toujours accepté.
 */
export function controlerContrastes(couleurs: CouleursPersonnalisees): ControleContraste[] {
  const { ciel } = deriverPalette(couleurs);
  const ratios: Record<CouleurPersonnalisable, number> = {
    primaire: contraste(couleurs.primaire, ciel),
    marine: contraste(couleurs.marine, ciel),
    accent: contraste(couleurs.accent, BLANC),
    fond: contraste(COULEUR_TEXTE_SECONDAIRE, couleurs.fond),
  };
  return (Object.keys(ratios) as CouleurPersonnalisable[]).map((couleur) => ({
    couleur,
    ratio: ratios[couleur],
    estLisible: couleur === "accent" || ratios[couleur] >= CONTRASTE_MIN_TEXTE,
  }));
}

export const sontLisibles = (couleurs: CouleursPersonnalisees) => controlerContrastes(couleurs).every((controle) => controle.estLisible);
