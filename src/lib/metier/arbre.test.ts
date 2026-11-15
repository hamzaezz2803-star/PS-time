import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  aplatirArbre,
  construireArbre,
  filtrerArbre,
  idsAvecEnfants,
  idsAncetres,
  idsDescendants,
  nomDejaPris,
  peutDeplacer,
  totalAvecDescendants,
  type ElementArbre,
} from "./arbre.ts";

// Données fictives.
const LISTE: ElementArbre[] = [
  { id: "prod", nom: "Production", parentId: null },
  { id: "sousprod", nom: "Sous-production", parentId: "prod" },
  { id: "atelier", nom: "Atelier", parentId: "sousprod" },
  { id: "si", nom: "Systèmes information", parentId: null },
  { id: "dev", nom: "Développement", parentId: "si" },
  { id: "logistique", nom: "logistique", parentId: null },
];

describe("construireArbre", () => {
  it("accepte un autre ordre de tri (ex. ordre d'affichage puis nom)", () => {
    const postes = [
      { id: "b", nom: "B", parentId: null, ordre: 1 },
      { id: "a", nom: "A", parentId: null, ordre: 2 },
    ];
    const arbre = construireArbre(postes, (x, y) => x.ordre - y.ordre);
    assert.deepEqual(arbre.map((noeud) => noeud.id), ["b", "a"]);
  });

  it("range les enfants sous leur parent et trie par nom", () => {
    const arbre = construireArbre(LISTE);
    assert.deepEqual(
      arbre.map((noeud) => noeud.nom),
      ["logistique", "Production", "Systèmes information"],
    );
    const production = arbre.find((noeud) => noeud.id === "prod");
    assert.equal(production?.enfants[0]?.id, "sousprod");
    assert.equal(production?.enfants[0]?.enfants[0]?.id, "atelier");
  });

  it("place à la racine un département dont le parent est introuvable", () => {
    const arbre = construireArbre([{ id: "seul", nom: "Seul", parentId: "inconnu" }]);
    assert.equal(arbre.length, 1);
    assert.equal(arbre[0]?.id, "seul");
  });

  it("renvoie un arbre vide pour une liste vide", () => {
    assert.deepEqual(construireArbre([]), []);
  });
});

describe("idsDescendants", () => {
  it("trouve les sous-départements à tous les niveaux", () => {
    assert.deepEqual([...idsDescendants(LISTE, "prod")].sort(), ["atelier", "sousprod"]);
  });

  it("renvoie un ensemble vide pour une feuille", () => {
    assert.equal(idsDescendants(LISTE, "atelier").size, 0);
  });
});

describe("idsAncetres", () => {
  it("remonte jusqu'à la racine, du plus proche au plus lointain", () => {
    assert.deepEqual(idsAncetres(LISTE, "atelier"), ["sousprod", "prod"]);
  });

  it("renvoie une liste vide pour un département principal ou inconnu", () => {
    assert.deepEqual(idsAncetres(LISTE, "prod"), []);
    assert.deepEqual(idsAncetres(LISTE, "inconnu"), []);
  });

  it("s'arrête sur une boucle au lieu de tourner sans fin", () => {
    const boucle: ElementArbre[] = [
      { id: "a", nom: "A", parentId: "b" },
      { id: "b", nom: "B", parentId: "a" },
    ];
    assert.deepEqual(idsAncetres(boucle, "a"), ["b", "a"]);
  });
});

describe("peutDeplacer", () => {
  it("autorise un déplacement vers la racine ou une autre branche", () => {
    assert.equal(peutDeplacer(LISTE, "sousprod", null), true);
    assert.equal(peutDeplacer(LISTE, "sousprod", "si"), true);
  });

  it("refuse de placer un département sous lui-même", () => {
    assert.equal(peutDeplacer(LISTE, "prod", "prod"), false);
  });

  it("refuse de placer un département sous un de ses descendants (boucle)", () => {
    assert.equal(peutDeplacer(LISTE, "prod", "atelier"), false);
  });
});

describe("nomDejaPris", () => {
  it("détecte un doublon chez les frères, sans tenir compte de la casse ni des espaces", () => {
    assert.equal(nomDejaPris(LISTE, "  PRODUCTION ", null), true);
    assert.equal(nomDejaPris(LISTE, "Logistique", null), true);
  });

  it("accepte le même nom sous un autre parent", () => {
    assert.equal(nomDejaPris(LISTE, "Atelier", "si"), false);
  });

  it("ignore le département en cours de modification", () => {
    assert.equal(nomDejaPris(LISTE, "Production", null, "prod"), false);
  });
});

describe("aplatirArbre", () => {
  it("donne l'ordre de l'arbre avec la profondeur", () => {
    const plat = aplatirArbre(construireArbre(LISTE));
    assert.deepEqual(
      plat.map(({ id, profondeur }) => `${id}:${profondeur}`),
      ["logistique:0", "prod:0", "sousprod:1", "atelier:2", "si:0", "dev:1"],
    );
  });
});

describe("totalAvecDescendants", () => {
  const compteurs = { prod: 2, sousprod: 1, atelier: 4, si: 3 };

  it("additionne l'élément et tous ses descendants", () => {
    assert.equal(totalAvecDescendants(LISTE, "prod", compteurs), 7);
  });

  it("compte zéro pour un élément sans valeur ni descendant", () => {
    assert.equal(totalAvecDescendants(LISTE, "logistique", compteurs), 0);
  });
});

describe("filtrerArbre", () => {
  const arbre = construireArbre(LISTE);
  const contient = (texte: string) => (element: ElementArbre) => element.nom.toLowerCase().includes(texte);

  it("garde l'élément trouvé et ses parents", () => {
    const resultat = aplatirArbre(filtrerArbre(arbre, contient("atelier")));
    assert.deepEqual(resultat.map((element) => element.id), ["prod", "sousprod", "atelier"]);
  });

  it("garde les enfants d'un parent trouvé", () => {
    const resultat = aplatirArbre(filtrerArbre(arbre, contient("systèmes")));
    assert.deepEqual(resultat.map((element) => element.id), ["si", "dev"]);
  });

  it("renvoie un arbre vide sans correspondance", () => {
    assert.deepEqual(filtrerArbre(arbre, contient("inconnu")), []);
  });
});

describe("idsAvecEnfants", () => {
  it("liste les parents à tous les niveaux", () => {
    assert.deepEqual([...idsAvecEnfants(construireArbre(LISTE))].sort(), ["prod", "si", "sousprod"]);
  });
});
