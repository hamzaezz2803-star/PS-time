import "server-only";

import { asc, eq, isNotNull } from "drizzle-orm";
import type { CouleurRegle } from "@/lib/constantes";
import { estCouleurRegle, type CouleurChoisie, type CouleursPlanning } from "@/lib/metier/couleurs-planning";
import { obtenirBase } from "./base";
import { evenements, profilsHoraires } from "./schema";

/** Un événement ou un profil horaire, avec sa couleur dans le planning (null = selon le type). */
export type CodeAColorer = { id: string; code: string; nom: string; type: string; couleur: CouleurRegle | null };

export type CodesAColorer = { evenements: CodeAColorer[]; profils: CodeAColorer[] };

/** Choix envoyé par Administration > Apparence (identifiants et couleurs déjà validés). */
export type ChoixCouleurCode = { genre: "evenement" | "profil"; id: string; couleur: CouleurRegle | null };

const couleurLue = (valeur: string | null): CouleurRegle | null => (valeur !== null && estCouleurRegle(valeur) ? valeur : null);

function parCode(lignes: readonly { code: string; nom: string; couleur: string | null }[]): ReadonlyMap<string, CouleurChoisie> {
  const choix = new Map<string, CouleurChoisie>();
  for (const ligne of lignes) {
    const couleur = couleurLue(ligne.couleur);
    if (couleur) choix.set(ligne.code, { couleur, nom: ligne.nom });
  }
  return choix;
}

/** Couleurs choisies pour les événements et les profils horaires (lues à chaque affichage du planning). */
export async function lireCouleursPlanning(): Promise<CouleursPlanning> {
  const base = obtenirBase();
  const [lignesEvenements, lignesProfils] = await Promise.all([
    base.select({ code: evenements.code, nom: evenements.nom, couleur: evenements.couleur }).from(evenements).where(isNotNull(evenements.couleur)),
    base.select({ code: profilsHoraires.code, nom: profilsHoraires.nom, couleur: profilsHoraires.couleur }).from(profilsHoraires).where(isNotNull(profilsHoraires.couleur)),
  ]);
  return { evenements: parCode(lignesEvenements), profils: parCode(lignesProfils) };
}

/** Tous les événements et profils horaires, par code, pour choisir leur couleur. */
export async function listerCodesAColorer(): Promise<CodesAColorer> {
  const base = obtenirBase();
  const [lignesEvenements, lignesProfils] = await Promise.all([
    base.select({ id: evenements.id, code: evenements.code, nom: evenements.nom, type: evenements.type, couleur: evenements.couleur }).from(evenements).orderBy(asc(evenements.code)),
    base.select({ id: profilsHoraires.id, code: profilsHoraires.code, nom: profilsHoraires.nom, type: profilsHoraires.type, couleur: profilsHoraires.couleur }).from(profilsHoraires).orderBy(asc(profilsHoraires.code)),
  ]);
  const lire = (ligne: (typeof lignesEvenements)[number]): CodeAColorer => ({ ...ligne, couleur: couleurLue(ligne.couleur) });
  return { evenements: lignesEvenements.map(lire), profils: lignesProfils.map(lire) };
}

/** Enregistre les couleurs en une transaction ; renvoie le nombre de lignes modifiées (un code supprimé entre-temps est ignoré). */
export async function enregistrerCouleursPlanning(choix: readonly ChoixCouleurCode[]): Promise<number> {
  return obtenirBase().transaction(async (transaction) => {
    let modifiees = 0;
    for (const { genre, id, couleur } of choix) {
      const table = genre === "evenement" ? evenements : profilsHoraires;
      const lignes = await transaction.update(table).set({ couleur }).where(eq(table.id, id)).returning({ id: table.id });
      modifiees += lignes.length;
    }
    return modifiees;
  });
}
