import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FORMULE_LONGUEUR_MAX, FORMULE_NOEUDS_MAX, FORMULE_PROFONDEUR_MAX } from "../../constantes.ts";
import { messageErreurFormule } from "../../textes/formules.ts";
import { calculerFormule, compilerFormule, type CodeErreurFormule } from "./formule.ts";

// Variables fictives d'un compteur journalier.
const VARIABLES = ["RETARD_MIN", "DUREE_PREVUE_MIN", "DUREE_TRAVAILLEE_MIN", "PRESENT", "A_HORAIRE"];

/** Compile et calcule ; échoue le test si la compilation échoue. */
function calcul(formule: string, valeurs: Record<string, number | null> = {}) {
  const compilation = compilerFormule(formule, VARIABLES);
  assert.ok(compilation.ok, `compilation refusée : ${formule}`);
  return calculerFormule(compilation.formule, valeurs);
}

const valeur = (formule: string, valeurs: Record<string, number | null> = {}) => {
  const resultat = calcul(formule, valeurs);
  assert.ok(resultat.ok, `calcul refusé : ${formule}`);
  return resultat.valeur;
};

const erreurCompilation = (formule: string, variables = VARIABLES): CodeErreurFormule | null => {
  const resultat = compilerFormule(formule, variables);
  return resultat.ok ? null : resultat.erreur.code;
};

describe("formules : calcul", () => {
  it("respecte les priorités et les parenthèses", () => {
    assert.equal(valeur("1 + 2 * 3"), 7);
    assert.equal(valeur("(1 + 2) * 3"), 9);
    assert.equal(valeur("10 - 4 - 3"), 3);
    assert.equal(valeur("12 / 4 / 3"), 1);
    assert.equal(valeur("-2 * -3"), 6);
    assert.equal(valeur(".5 + 1.25"), 1.75);
  });

  it("lit les variables sans tenir compte de la casse", () => {
    assert.equal(valeur("retard_min + Duree_Prevue_Min", { RETARD_MIN: 10, duree_prevue_min: 480 }), 490);
  });

  it("calcule les fonctions", () => {
    assert.equal(valeur("IF(RETARD_MIN > 5, RETARD_MIN, 0)", { RETARD_MIN: 12 }), 12);
    assert.equal(valeur("IF(RETARD_MIN > 5, RETARD_MIN, 0)", { RETARD_MIN: 3 }), 0);
    assert.equal(valeur("MIN(4, 2, 9) + MAX(1, 7)"), 9);
    assert.equal(valeur("ABS(-3) + FLOOR(2.7) + CEIL(2.1)"), 8);
    assert.equal(valeur("ROUND(2.5) + ROUND(-2.5)"), 0);
    assert.equal(valeur("ROUND(1.005, 2)"), 1.01);
    assert.equal(valeur("ROUND(DUREE_PREVUE_MIN / 60, 1)", { DUREE_PREVUE_MIN: 470 }), 7.8);
  });

  it("accepte toutes les écritures des comparaisons et la logique", () => {
    assert.equal(valeur("IF(1 = 1 AND 2 == 2 AND 1 != 2 AND 1 <> 2, 1, 0)"), 1);
    assert.equal(valeur("IF(NOT (PRESENT = 1) OR FALSE, 1, 0)", { PRESENT: 0 }), 1);
    assert.equal(valeur("IF(3 >= 3 AND 2 <= 3 AND 2 < 3 AND TRUE, 1, 0)"), 1);
  });

  it("ne renvoie jamais -0", () => {
    assert.ok(Object.is(valeur("-0"), 0));
  });
});

describe("formules : données manquantes", () => {
  it("donne une erreur, jamais 0, en listant les variables manquantes", () => {
    const resultat = calcul("RETARD_MIN + DUREE_PREVUE_MIN", { RETARD_MIN: null });
    assert.deepEqual(resultat, { ok: false, erreur: { code: "DONNEE_MANQUANTE", variables: ["DUREE_PREVUE_MIN", "RETARD_MIN"] } });
  });

  it("COALESCE fournit une valeur par défaut", () => {
    assert.equal(valeur("COALESCE(RETARD_MIN, 0) + 1", { RETARD_MIN: null }), 1);
    assert.equal(valeur("COALESCE(RETARD_MIN, DUREE_PREVUE_MIN, 5)", { DUREE_PREVUE_MIN: 480 }), 480);
  });

  it("AND et OR s'arrêtent dès que la réponse est connue", () => {
    assert.equal(valeur("IF(FALSE AND RETARD_MIN > 0, 1, 0)"), 0);
    assert.equal(valeur("IF(RETARD_MIN > 0 OR TRUE, 1, 0)"), 1);
    assert.equal(calcul("IF(TRUE AND RETARD_MIN > 0, 1, 0)").ok, false);
  });

  it("IF ne calcule que la branche retenue", () => {
    assert.equal(valeur("IF(PRESENT = 1, 8, RETARD_MIN)", { PRESENT: 1 }), 8);
    assert.equal(calcul("IF(PRESENT = 1, 8, 0)").ok, false);
  });
});

describe("formules : erreurs de calcul", () => {
  it("refuse la division par zéro avec sa position", () => {
    assert.deepEqual(calcul("10 / (RETARD_MIN - 5)", { RETARD_MIN: 5 }), { ok: false, erreur: { code: "DIVISION_PAR_ZERO", position: 6 } });
  });

  it("refuse un nombre de décimales invalide et un résultat infini", () => {
    assert.equal(calcul("ROUND(1.5, 0.5)").ok, false);
    assert.equal(calcul("ROUND(1.5, 11)").ok, false);
    const enorme = Array.from({ length: 40 }, () => "99999999").join(" * ");
    const resultat = calcul(enorme);
    assert.equal(!resultat.ok && resultat.erreur.code, "VALEUR_INVALIDE");
  });
});

describe("formules : compilation", () => {
  it("refuse une syntaxe incorrecte", () => {
    for (const formule of ["1 +", "(1 + 2", "1 + 2)", "MIN(1,)", "1 2", "AND", "1 < 2 < 3", "IF(1 > 0, 1 0)"]) {
      assert.equal(erreurCompilation(formule), "SYNTAXE", formule);
    }
  });

  it("refuse les caractères et les nombres invalides", () => {
    assert.equal(erreurCompilation("1 ; 2"), "CARACTERE_INVALIDE");
    assert.equal(erreurCompilation("RETARD_MIN % 2"), "CARACTERE_INVALIDE");
    assert.equal(erreurCompilation("1.2.3"), "NOMBRE_INVALIDE");
    assert.equal(erreurCompilation("1,5 + 2"), "SYNTAXE");
    assert.equal(erreurCompilation("12abc"), "NOMBRE_INVALIDE");
  });

  it("refuse une variable inconnue pour la périodicité visée", () => {
    assert.equal(erreurCompilation("NB_ABSENCES + 1"), "VARIABLE_INCONNUE");
    assert.equal(erreurCompilation("NB_ABSENCES + 1", [...VARIABLES, "NB_ABSENCES"]), null);
  });

  it("refuse une fonction inconnue ou un mauvais nombre de valeurs", () => {
    assert.equal(erreurCompilation("SQRT(4)"), "FONCTION_INCONNUE");
    assert.equal(erreurCompilation("IF(1 > 0, 1)"), "NOMBRE_ARGUMENTS");
    assert.equal(erreurCompilation("ABS(1, 2)"), "NOMBRE_ARGUMENTS");
    assert.equal(erreurCompilation("MIN()"), "NOMBRE_ARGUMENTS");
  });

  it("contrôle les types", () => {
    assert.equal(erreurCompilation("IF(RETARD_MIN, 1, 0)"), "TYPE_INCORRECT");
    assert.equal(erreurCompilation("IF(TRUE, 1, FALSE)"), "TYPE_INCORRECT");
    assert.equal(erreurCompilation("TRUE + 1"), "TYPE_INCORRECT");
    assert.equal(erreurCompilation("IF(1 AND 2, 1, 0)"), "TYPE_INCORRECT");
    assert.equal(erreurCompilation("IF(TRUE > FALSE, 1, 0)"), "TYPE_INCORRECT");
    assert.equal(erreurCompilation("IF(TRUE = 1, 1, 0)"), "TYPE_INCORRECT");
    assert.equal(erreurCompilation("COALESCE(RETARD_MIN, TRUE)"), "TYPE_INCORRECT");
    assert.equal(erreurCompilation("IF((1 > 0) = TRUE, 1, 0)"), null);
  });

  it("exige un résultat numérique", () => {
    assert.equal(erreurCompilation("RETARD_MIN > 5"), "RESULTAT_NON_NUMERIQUE");
  });

  it("applique les limites de longueur, de profondeur et de taille", () => {
    assert.equal(erreurCompilation("   "), "FORMULE_VIDE");
    assert.equal(erreurCompilation("1+".repeat(FORMULE_LONGUEUR_MAX / 2) + "1"), "FORMULE_TROP_LONGUE");
    const profonde = "(".repeat(FORMULE_PROFONDEUR_MAX) + "1" + ")".repeat(FORMULE_PROFONDEUR_MAX);
    assert.equal(erreurCompilation(profonde), "FORMULE_TROP_PROFONDE");
    assert.equal(erreurCompilation("-".repeat(FORMULE_PROFONDEUR_MAX) + "1"), "FORMULE_TROP_PROFONDE");
    assert.equal(erreurCompilation(Array.from({ length: FORMULE_NOEUDS_MAX }, () => "1").join("+")), "FORMULE_TROP_COMPLEXE");
  });

  it("donne la position de l'erreur et les variables utilisées", () => {
    const resultat = compilerFormule("RETARD_MIN + INCONNUE", VARIABLES);
    assert.deepEqual(resultat, { ok: false, erreur: { code: "VARIABLE_INCONNUE", position: 13, detail: "INCONNUE" } });
    const compilee = compilerFormule("present * retard_min + RETARD_MIN", VARIABLES);
    assert.deepEqual(compilee.ok && compilee.formule.variables, ["PRESENT", "RETARD_MIN"]);
  });

  it("n'exécute jamais de code JavaScript", () => {
    assert.equal(erreurCompilation("constructor.constructor('return 1')()"), "CARACTERE_INVALIDE");
    assert.equal(erreurCompilation("process"), "VARIABLE_INCONNUE");
  });
});

describe("formules : messages lisibles", () => {
  it("explique l'erreur, les variables manquantes et la position (à partir de 1)", () => {
    assert.equal(
      messageErreurFormule({ code: "VARIABLE_INCONNUE", position: 13, detail: "INCONNUE" }),
      "La variable « INCONNUE » n'existe pas pour cette périodicité. (caractère 14)",
    );
    assert.match(messageErreurFormule({ code: "DONNEE_MANQUANTE", variables: ["RETARD_MIN"] }), /Sans valeur : RETARD_MIN\./);
  });
});

describe("formules : robustesse", () => {
  it("renvoie toujours un résultat explicite, même pour une saisie au hasard", () => {
    const morceaux = ["1", "0", "2.5", "RETARD_MIN", "PRESENT", "(", ")", ",", "+", "-", "*", "/", ">", "=", "<>", "AND", "OR", "NOT", "TRUE", "IF(", "MIN(", "COALESCE(", "ROUND(", " ", "@", ".", "INCONNUE"];
    let graine = 42;
    // Générateur pseudo-aléatoire reproductible (le test donne toujours le même résultat).
    const auHasard = (maximum: number) => {
      graine = (graine * 1103515245 + 12345) % 2 ** 31;
      return graine % maximum;
    };
    for (let essai = 0; essai < 2000; essai += 1) {
      const formule = Array.from({ length: 1 + auHasard(25) }, () => morceaux[auHasard(morceaux.length)]).join("");
      const compilation = compilerFormule(formule, VARIABLES);
      if (compilation.ok) {
        const resultat = calculerFormule(compilation.formule, { RETARD_MIN: auHasard(3) === 0 ? null : auHasard(20), PRESENT: auHasard(2) });
        assert.equal(typeof resultat.ok, "boolean", formule);
        if (resultat.ok) assert.ok(Number.isFinite(resultat.valeur), formule);
      } else {
        assert.equal(typeof messageErreurFormule(compilation.erreur), "string", formule);
      }
    }
  });
});
