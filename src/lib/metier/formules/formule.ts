/**
 * Moteur des formules de compteurs : un petit langage sûr, interprété par nos soins
 * (découpage → arbre → contrôle de types → calcul). Jamais d'`eval`, de `new Function`
 * ni de SQL construit depuis la formule. Fonctions pures, testées dans formule.test.ts.
 *
 * Exemple : IF(RETARD_MIN > 5, RETARD_MIN, 0)
 */
import { FORMULE_LONGUEUR_MAX } from "../../constantes.ts";
import { calculer } from "./evaluation.ts";
import { EchecFormule, type ErreurFormule } from "./erreurs.ts";
import { decouper } from "./lexer.ts";
import { analyser, type Noeud } from "./parser.ts";
import { typer } from "./typage.ts";

export type { CodeErreurFormule, ErreurFormule } from "./erreurs.ts";

/** Formule vérifiée, prête à être calculée autant de fois qu'il faut (réutilisable entre employés). */
export type FormuleCompilee = {
  arbre: Noeud;
  /** Variables utilisées, en majuscules, sans doublon et triées. */
  variables: string[];
};

export type ResultatCompilation = { ok: true; formule: FormuleCompilee } | { ok: false; erreur: ErreurFormule };
export type ResultatCalcul = { ok: true; valeur: number } | { ok: false; erreur: ErreurFormule };

/** Exécute `action` en transformant une erreur de formule en résultat explicite. */
function sansException<T>(action: () => T): T | { ok: false; erreur: ErreurFormule } {
  try {
    return action();
  } catch (erreur) {
    if (erreur instanceof EchecFormule) return { ok: false, erreur: erreur.erreur };
    throw erreur;
  }
}

function variablesUtilisees(noeud: Noeud, trouvees: Set<string>): Set<string> {
  if (noeud.type === "variable") trouvees.add(noeud.nom);
  if (noeud.type === "unaire") variablesUtilisees(noeud.operande, trouvees);
  if (noeud.type === "binaire") [noeud.gauche, noeud.droite].forEach((enfant) => variablesUtilisees(enfant, trouvees));
  if (noeud.type === "fonction") noeud.arguments.forEach((enfant) => variablesUtilisees(enfant, trouvees));
  return trouvees;
}

/**
 * Vérifie une formule. `variablesConnues` : noms des variables disponibles pour la périodicité
 * visée (une variable connue ailleurs mais pas ici est une erreur). Le résultat doit être un nombre.
 */
export function compilerFormule(formule: string, variablesConnues: Iterable<string>): ResultatCompilation {
  if (formule.trim() === "") return { ok: false, erreur: { code: "FORMULE_VIDE" } };
  if (formule.length > FORMULE_LONGUEUR_MAX) return { ok: false, erreur: { code: "FORMULE_TROP_LONGUE" } };
  const connues = new Set([...variablesConnues].map((nom) => nom.toUpperCase()));

  return sansException((): ResultatCompilation => {
    const arbre = analyser(decouper(formule));
    if (typer(arbre, connues) !== "nombre") return { ok: false, erreur: { code: "RESULTAT_NON_NUMERIQUE", position: arbre.position } };
    return { ok: true, formule: { arbre, variables: [...variablesUtilisees(arbre, new Set())].sort() } };
  });
}

/**
 * Calcule une formule compilée avec les valeurs données (clé : nom de variable, en majuscules ou
 * non ; null ou absente = donnée manquante). On ne renvoie jamais 0 à la place d'une erreur.
 */
export function calculerFormule(formule: FormuleCompilee, valeurs: Readonly<Record<string, number | null>>): ResultatCalcul {
  const enMajuscules = new Map(Object.entries(valeurs).map(([nom, valeur]) => [nom.toUpperCase(), valeur]));
  const contexte = { valeurs: enMajuscules, manquantes: new Set<string>() };

  return sansException((): ResultatCalcul => {
    const valeur = calculer(formule.arbre, contexte);
    if (valeur === null) return { ok: false, erreur: { code: "DONNEE_MANQUANTE", variables: [...contexte.manquantes].sort() } };
    // Le typage garantit un nombre ; -0 est ramené à 0 pour l'affichage.
    return { ok: true, valeur: (valeur as number) + 0 };
  });
}
