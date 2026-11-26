import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FORMAT_SAUVEGARDE } from "../constantes.ts";
import { creerSignataire, lireSauvegarde, nomFichierSauvegarde, texteEnTete } from "./sauvegarde.ts";
import { instructionInsert, valeurSql } from "./sauvegarde-sql.ts";

const SECRET = "secret-de-test-fictif";
const MIGRATION = "28-1795267094926";
const TABLES = {
  avecComptes: { sites: ["id", "nom"], utilisateurs: ["id", "nom"] },
  sansComptes: { sites: ["id", "nom"] },
};

function fichier(corps: string[], options: { avecComptes?: boolean; migration?: string; secret?: string; format?: number } = {}): string {
  const avecComptes = options.avecComptes ?? false;
  const signataire = creerSignataire(options.secret ?? SECRET);
  const enTete = texteEnTete({ format: options.format ?? FORMAT_SAUVEGARDE, migration: options.migration ?? MIGRATION, avecComptes, creeLe: "2026-11-21T10:00:00.000Z", tables: Object.keys(avecComptes ? TABLES.avecComptes : TABLES.sansComptes) });
  const contenu = enTete + corps.map((ligne) => `${ligne}\n`).join("");
  signataire.ajouter(contenu);
  return contenu + signataire.ligneFinale();
}

const SITES = ['DELETE FROM "sites";', instructionInsert("sites", ["id", "nom"], [[valeurSql("1"), valeurSql("Usine d'Aïn Sebaâ")]]), "COMMIT;"];

describe("lireSauvegarde", () => {
  it("accepte un fichier signé à la même version", () => {
    const lu = lireSauvegarde(fichier(SITES), SECRET, MIGRATION, TABLES);
    assert.equal(lu.ok, true);
    if (lu.ok) {
      assert.equal(lu.enTete.avecComptes, false);
      assert.deepEqual(lu.insertions[0].lignes[0], ["1", "Usine d'Aïn Sebaâ"]);
    }
  });

  it("accepte des fins de ligne Windows", () => {
    assert.equal(lireSauvegarde(fichier(SITES).replace(/\n/g, "\r\n"), SECRET, MIGRATION, TABLES).ok, true);
  });

  it("refuse un fichier modifié, d'une autre installation ou sans signature", () => {
    const modifie = fichier(SITES).replace("Usine", "Usinе");
    assert.deepEqual(lireSauvegarde(modifie, SECRET, MIGRATION, TABLES), { ok: false, erreur: "signature" });
    assert.deepEqual(lireSauvegarde(fichier(SITES, { secret: "autre" }), SECRET, MIGRATION, TABLES), { ok: false, erreur: "signature" });
    assert.deepEqual(lireSauvegarde(`INSERT INTO "sites" ("id") VALUES (E'1');\n`, SECRET, MIGRATION, TABLES), { ok: false, erreur: "signature" });
    const ajoutApres = `${fichier(SITES)}DROP TABLE "sites";\n`;
    assert.deepEqual(lireSauvegarde(ajoutApres, SECRET, MIGRATION, TABLES), { ok: false, erreur: "signature" });
  });

  it("refuse un fichier de l'ancienne base MySQL (format 1)", () => {
    assert.deepEqual(lireSauvegarde(fichier(SITES, { format: 1 }), SECRET, MIGRATION, TABLES), { ok: false, erreur: "format" });
  });

  it("refuse une autre version de la base", () => {
    assert.deepEqual(lireSauvegarde(fichier(SITES, { migration: "27-1" }), SECRET, MIGRATION, TABLES), { ok: false, erreur: "migration" });
  });

  it("refuse une instruction inconnue même signée (défense en profondeur)", () => {
    const piege = fichier([...SITES, 'DROP TABLE "sites";']);
    assert.deepEqual(lireSauvegarde(piege, SECRET, MIGRATION, TABLES), { ok: false, erreur: "contenu" });
    const autreTable = fichier([instructionInsert("utilisateurs", ["id", "nom"], [[valeurSql("1"), valeurSql("x")]])]);
    assert.deepEqual(lireSauvegarde(autreTable, SECRET, MIGRATION, TABLES), { ok: false, erreur: "contenu" });
    const colonneInconnue = fichier([instructionInsert("sites", ["id", "est_super_admin"], [[valeurSql("1"), valeurSql("true")]])]);
    assert.deepEqual(lireSauvegarde(colonneInconnue, SECRET, MIGRATION, TABLES), { ok: false, erreur: "contenu" });
  });

  it("lit la case comptes et vérifie la liste des tables", () => {
    const lu = lireSauvegarde(fichier(SITES, { avecComptes: true }), SECRET, MIGRATION, TABLES);
    assert.equal(lu.ok && lu.enTete.avecComptes, true);
    const tablesManquantes = { ...TABLES, sansComptes: { sites: ["id"], postes: ["id"] } };
    assert.deepEqual(lireSauvegarde(fichier(SITES), SECRET, MIGRATION, tablesManquantes), { ok: false, erreur: "tables" });
  });
});

describe("nomFichierSauvegarde", () => {
  it("date et heure de Casablanca, sans caractère interdit dans un nom de fichier", () => {
    // Décalage de Casablanca selon les données de fuseau de Node : seul le format est vérifié.
    assert.match(nomFichierSauvegarde("ps-time-sauvegarde", new Date("2026-11-21T13:05:09Z")), /^ps-time-sauvegarde-2026-11-21-1[34]0509\.sql$/);
  });
});
