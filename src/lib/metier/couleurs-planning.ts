/**
 * Couleurs du planning (d'après la « personnalisation des couleurs » de Gestor) : chaque événement
 * et chaque profil horaire peut recevoir une couleur de la palette fixe (contrastes vérifiés dans
 * globals.css), choisie dans Administration > Apparence. Sans choix, la couleur suit le type.
 * Fonctions pures, testées dans couleurs-planning.test.ts.
 */
import { COULEURS_REGLE, type CouleurRegle } from "../constantes.ts";
import type { EvenementResume } from "./resume-jour.ts";

/** Teinte d'une case : une couleur de la palette, un jour de travail sans couleur choisie, ou un jour sans affectation. */
export type TeinteCase = CouleurRegle | "travail" | "sans_planning";

/** Couleur choisie pour un code, avec son libellé (repris dans la légende). */
export type CouleurChoisie = { couleur: CouleurRegle; nom: string };

/** Couleurs choisies, par code d'événement et par code de profil horaire. */
export type CouleursPlanning = {
  evenements: ReadonlyMap<string, CouleurChoisie>;
  profils: ReadonlyMap<string, CouleurChoisie>;
};

export const AUCUNE_COULEUR_CHOISIE: CouleursPlanning = { evenements: new Map(), profils: new Map() };

/** Couleurs selon le type, quand aucune n'est choisie (celles d'avant la personnalisation). */
export const TEINTES_PAR_DEFAUT = { absence: "orange", presence: "turquoise", repos: "vert" } as const satisfies Record<string, CouleurRegle>;

export const estCouleurRegle = (valeur: string): valeur is CouleurRegle => (COULEURS_REGLE as readonly string[]).includes(valeur);

type JourColorable = { evenement: Pick<EvenementResume, "code" | "type"> | null; profilCode: string | null; estSansPlanning: boolean };

/** Teinte d'une journée : l'événement retenu, sinon le profil, sinon repos ou « aucun horaire ». */
export function teinteDuJour(jour: JourColorable, couleurs: CouleursPlanning): TeinteCase {
  if (jour.evenement) return couleurs.evenements.get(jour.evenement.code)?.couleur ?? TEINTES_PAR_DEFAUT[jour.evenement.type];
  if (jour.profilCode) return couleurs.profils.get(jour.profilCode)?.couleur ?? "travail";
  return jour.estSansPlanning ? "sans_planning" : TEINTES_PAR_DEFAUT.repos;
}

export type CodeColore = { genre: "evenement" | "profil"; code: string; nom: string; couleur: CouleurRegle };

/** Codes à couleur choisie affichés sur la période (légende), événements d'abord, par code. */
export function codesColoresAffiches(jours: readonly JourColorable[], couleurs: CouleursPlanning): CodeColore[] {
  const evenements = new Map<string, CodeColore>();
  const profils = new Map<string, CodeColore>();
  for (const jour of jours) {
    if (jour.evenement) {
      const choix = couleurs.evenements.get(jour.evenement.code);
      if (choix) evenements.set(jour.evenement.code, { genre: "evenement", code: jour.evenement.code, ...choix });
    } else if (jour.profilCode) {
      const choix = couleurs.profils.get(jour.profilCode);
      if (choix) profils.set(jour.profilCode, { genre: "profil", code: jour.profilCode, ...choix });
    }
  }
  const parCode = (a: CodeColore, b: CodeColore) => a.code.localeCompare(b.code, "fr");
  return [...[...evenements.values()].sort(parCode), ...[...profils.values()].sort(parCode)];
}
