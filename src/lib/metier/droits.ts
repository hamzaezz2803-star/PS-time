import { MODULES } from "../constantes.ts";

export type Module = (typeof MODULES)[number];

/** Ce qu'il faut savoir d'un compte pour décider de ses droits. */
export type Droits = { estSuperAdmin: boolean; modules: readonly string[] };

/** Un super administrateur gère tout ; un administrateur, seulement les modules qui lui sont accordés. */
export function peutGerer(droits: Droits, module: Module): boolean {
  return droits.estSuperAdmin || droits.modules.includes(module);
}

/** Modules effectivement accessibles, dans l'ordre du menu. */
export function modulesAccessibles(droits: Droits): Module[] {
  return MODULES.filter((module) => peutGerer(droits, module));
}

/** Garde les modules connus, sans doublon, dans l'ordre du menu (entrée venue d'un formulaire). */
export function nettoyerModules(saisis: readonly string[]): Module[] {
  return MODULES.filter((module) => saisis.includes(module));
}
