import { MODULES, PAGES, PAGES_PAR_MODULE } from "../constantes.ts";

export type Module = (typeof MODULES)[number];
export type Page = (typeof PAGES)[number];

/** Ce qu'il faut savoir d'un compte pour décider de ses droits. */
export type Droits = { estSuperAdmin: boolean; pages: readonly string[] };

/** Un super administrateur a tout ; un administrateur, seulement les pages qui lui sont accordées. */
export function peutAcceder(droits: Droits, page: Page): boolean {
  return droits.estSuperAdmin || droits.pages.includes(page);
}

/** Vrai si le compte a au moins une page du module (menu, tableau de bord, notifications). */
export function aAccesAuModule(droits: Droits, module: Module): boolean {
  return PAGES_PAR_MODULE[module].some((page) => peutAcceder(droits, page));
}

/** Modules dont le compte a au moins une page, dans l'ordre du menu. */
export function modulesAccessibles(droits: Droits): Module[] {
  return MODULES.filter((module) => aAccesAuModule(droits, module));
}

/** Pages effectivement accessibles (toutes pour un super administrateur), dans l'ordre du menu. */
export function pagesAccessibles(droits: Droits): Page[] {
  return PAGES.filter((page) => peutAcceder(droits, page));
}

/** Garde les pages connues, sans doublon, dans l'ordre du menu (entrée venue d'un formulaire ou de la base). */
export function nettoyerPages(saisies: readonly string[]): Page[] {
  return PAGES.filter((page) => saisies.includes(page));
}
