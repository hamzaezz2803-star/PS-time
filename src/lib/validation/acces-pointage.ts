import { accesCoherent, appareilsVersTexte, doigtsVersTexte, normaliserAppareils, normaliserDoigts, type AccesPointage } from "@/lib/metier/acces-pointage";
import { TEXTES_PERSONNES } from "@/lib/textes/personnes";
import { lireTexte } from "./employe";

/** Noms des champs du formulaire employé (onglets Pointage à distance, Visage et empreintes). */
export const CHAMPS_ACCES = {
  pointageDistance: "pointageDistance",
  appareils: "appareilsDistance",
  exigePosition: "distanceExigePosition",
  exigePhoto: "distanceExigePhoto",
  doigts: "doigts",
  reinitialiserMotDePasse: "reinitialiserMotDePasse",
} as const;

/** Saisie telle quelle (valeurs inconnues ignorées), avant les règles de cohérence. */
export function lireAccesPointage(formulaire: FormData): AccesPointage {
  return {
    pointageDistance: formulaire.get(CHAMPS_ACCES.pointageDistance) === "oui",
    appareils: normaliserAppareils(formulaire.getAll(CHAMPS_ACCES.appareils).map(lireTexte)),
    exigePosition: formulaire.get(CHAMPS_ACCES.exigePosition) === "oui",
    exigePhoto: formulaire.get(CHAMPS_ACCES.exigePhoto) === "oui",
    doigts: normaliserDoigts(formulaire.getAll(CHAMPS_ACCES.doigts).map(lireTexte)),
  };
}

type ResultatAcces ={ ok: true; donnees: AccesPointage } | { ok: false; erreursChamps: Record<string, string> };

/**
 * Lit et vérifie l'accès au pointage. Valeurs inconnues ignorées ; une autorisation à distance
 * exige au moins un appareil. Sans autorisation, appareils et conditions sont effacés.
 */
export function validerAccesPointage(formulaire: FormData): ResultatAcces {
  const acces = accesCoherent(lireAccesPointage(formulaire));
  if (acces.pointageDistance && acces.appareils.length === 0) {
    return { ok: false, erreursChamps: { [CHAMPS_ACCES.appareils]: TEXTES_PERSONNES.erreurs.aucunAppareil } };
  }
  return { ok: true, donnees: acces };
}

/** Saisie réaffichée après une erreur, dans les valeurs texte du formulaire. */
export function accesVersValeurs(acces: AccesPointage): Record<string, string> {
  return {
    [CHAMPS_ACCES.pointageDistance]: acces.pointageDistance ? "oui" : "",
    [CHAMPS_ACCES.appareils]: appareilsVersTexte(acces.appareils),
    [CHAMPS_ACCES.exigePosition]: acces.exigePosition ? "oui" : "",
    [CHAMPS_ACCES.exigePhoto]: acces.exigePhoto ? "oui" : "",
    [CHAMPS_ACCES.doigts]: doigtsVersTexte(acces.doigts),
  };
}
