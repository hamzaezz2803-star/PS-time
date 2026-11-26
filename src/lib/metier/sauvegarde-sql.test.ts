import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { instructionInsert, lireInsertion, valeurSql } from "./sauvegarde-sql.ts";

describe("valeurSql", () => {
  it("écrit NULL et des textes échappés sur une seule ligne", () => {
    assert.equal(valeurSql(null), "NULL");
    assert.equal(valeurSql("12.5"), "E'12.5'");
    assert.equal(valeurSql("l'été\\\n\r"), "E'l\\'été\\\\\\n\\r'");
    assert.equal(valeurSql("\\x00ff"), "E'\\\\x00ff'");
  });

  it("refuse un caractère nul (impossible dans un texte PostgreSQL)", () => {
    assert.throws(() => valeurSql("a\0b"));
  });
});

describe("lireInsertion", () => {
  const valeurs = ["NULL", "E'-3'", "E'true'", "E'Aït \\'Ali\\'\\nligne 2'", "E'\\\\xcafe'", "E'2026-11-21 08:00:00+00'"];
  const ligne = instructionInsert("employes", ["a", "b", "c", "d", "e", "f"], [valeurs, valeurs]);

  it("écrit les noms entre guillemets doubles", () => {
    assert.ok(ligne.startsWith('INSERT INTO "employes" ("a","b","c","d","e","f") VALUES ('));
  });

  it("relit exactement ce qui a été écrit", () => {
    const insertion = lireInsertion(ligne);
    assert.ok(insertion);
    assert.equal(insertion.table, "employes");
    assert.deepEqual(insertion.colonnes, ["a", "b", "c", "d", "e", "f"]);
    assert.equal(insertion.lignes.length, 2);
    assert.deepEqual(insertion.lignes[0], [null, "-3", "true", "Aït 'Ali'\nligne 2", "\\xcafe", "2026-11-21 08:00:00+00"]);
  });

  it("aller-retour d'un texte quelconque", () => {
    const texte = "a'b\\c\rd\ne\x1af''\t";
    const insertion = lireInsertion(instructionInsert("t", ["x"], [[valeurSql(texte)]]));
    assert.equal(insertion?.lignes[0][0], texte);
  });

  it("refuse tout ce qui n'est pas un INSERT simple", () => {
    const refusees = [
      'DROP TABLE "employes";',
      `INSERT INTO "t" ("a") VALUES (E'1'); DROP TABLE "t";`,
      `INSERT INTO "t" ("a") VALUES (E'1')`,
      `INSERT INTO "t" ("a","b") VALUES (E'1');`,
      `INSERT INTO "t" ("a") VALUES (pg_sleep(5));`,
      `INSERT INTO "t" ("a") VALUES ((SELECT 1));`,
      `INSERT INTO "t" ("a") VALUES (1);`,
      `INSERT INTO "t" ("a") VALUES ('1');`,
      `INSERT INTO "T-1" ("a") VALUES (E'1');`,
      `INSERT INTO "t" ("a") VALUES (E'non fermé);`,
      `INSERT INTO "t" ("a") VALUES (E'\\q');`,
      `INSERT INTO "t" ("a") VALUES (E'1'::bytea);`,
      'INSERT INTO "t" ("a") SELECT * FROM "utilisateurs";',
      "INSERT INTO `t` (`a`) VALUES ('1');",
    ];
    for (const ligneRefusee of refusees) assert.equal(lireInsertion(ligneRefusee), null, ligneRefusee);
  });
});
