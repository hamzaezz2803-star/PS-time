import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { instructionInsert, lireInsertion, valeurSql } from "./sauvegarde-sql.ts";

describe("valeurSql", () => {
  it("écrit NULL, nombres, booléens, textes échappés et octets", () => {
    assert.equal(valeurSql(null), "NULL");
    assert.equal(valeurSql(12.5), "12.5");
    assert.equal(valeurSql(true), "1");
    assert.equal(valeurSql("l'été\\\n"), "'l\\'été\\\\\\n'");
    assert.equal(valeurSql(Buffer.from([0, 255])), "X'00ff'");
  });

  it("refuse un type inconnu ou un nombre infini", () => {
    assert.throws(() => valeurSql(new Date()));
    assert.throws(() => valeurSql(Number.POSITIVE_INFINITY));
  });
});

describe("lireInsertion", () => {
  const valeurs = ["NULL", "-3", "2.50", "'Aït \\'Ali\\'\\nligne 2'", "X'cafe'", "'2026-11-21 08:00:00.000'"];
  const ligne = instructionInsert("employes", ["a", "b", "c", "d", "e", "f"], [valeurs, valeurs]);

  it("relit exactement ce qui a été écrit", () => {
    const insertion = lireInsertion(ligne);
    assert.ok(insertion);
    assert.equal(insertion.table, "employes");
    assert.deepEqual(insertion.colonnes, ["a", "b", "c", "d", "e", "f"]);
    assert.equal(insertion.lignes.length, 2);
    assert.deepEqual(insertion.lignes[0], [null, "-3", "2.50", "Aït 'Ali'\nligne 2", Buffer.from("cafe", "hex"), "2026-11-21 08:00:00.000"]);
  });

  it("aller-retour d'un texte quelconque", () => {
    const texte = "a'b\\c\0d\re\x1af''";
    const insertion = lireInsertion(instructionInsert("t", ["x"], [[valeurSql(texte)]]));
    assert.equal(insertion?.lignes[0][0], texte);
  });

  it("refuse tout ce qui n'est pas un INSERT simple", () => {
    const refusees = [
      "DROP TABLE `employes`;",
      "INSERT INTO `t` (`a`) VALUES (1); DROP TABLE `t`;",
      "INSERT INTO `t` (`a`) VALUES (1)",
      "INSERT INTO `t` (`a`,`b`) VALUES (1);",
      "INSERT INTO `t` (`a`) VALUES (SLEEP(5));",
      "INSERT INTO `t` (`a`) VALUES ((SELECT 1));",
      "INSERT INTO `T-1` (`a`) VALUES (1);",
      "INSERT INTO `t` (`a`) VALUES ('non fermé);",
      "INSERT INTO `t` (`a`) VALUES ('\\q');",
      "INSERT INTO `t` (`a`) VALUES (X'abc');",
      "INSERT INTO `t` (`a`) SELECT * FROM `utilisateurs`;",
    ];
    for (const ligneRefusee of refusees) assert.equal(lireInsertion(ligneRefusee), null, ligneRefusee);
  });
});
