import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { COLONNES_EXPORT_EMPLOYES, versLigneExport } from "./export-employes.ts";

const employeFictif = {
  id: "00000000-0000-4000-8000-000000000001",
  matricule: "M-0001",
  numeroBadge: "1001",
  prenom: "Nadia",
  nom: "Fictive",
  departement: "Atelier",
  poste: null,
  telephone: "+212612345678",
  dateEmbauche: "2024-03-01",
  photoModifieeLe: null,
};

describe("versLigneExport", () => {
  it("formate le téléphone et la date, laisse vides les champs absents", () => {
    const ligne = versLigneExport(employeFictif, (jour) => `jour ${jour}`);
    assert.equal(ligne.telephone, "06 12 34 56 78");
    assert.equal(ligne.dateEmbauche, "jour 2024-03-01");
    assert.equal(ligne.poste, "");
  });

  it("ne contient aucune autre donnée que les colonnes prévues", () => {
    const ligne = versLigneExport({ ...employeFictif, telephone: null, dateEmbauche: null }, (jour) => jour);
    assert.deepEqual(Object.keys(ligne).sort(), COLONNES_EXPORT_EMPLOYES.map((colonne) => colonne.cle).sort());
    assert.equal(ligne.telephone, "");
  });
});
