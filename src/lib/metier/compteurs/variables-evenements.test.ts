import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculerCompteurs } from "./calcul.ts";
import { agregerJours, variablesDuJour, variablesPour, type JourService } from "./variables.ts";
import { minutesDeNuit, variablesEvenementsDuJour, type CodesCompteurs, type EvenementCompteur } from "./variables-evenements.ts";

const CODES: CodesCompteurs = { evenements: ["CP", "MAL", "FOR", "REC"], droits: ["CP"] };
const HORAIRE = { debutPrevu: 480, finPrevue: 1020, dureePrevue: 480, estBadge: true };

const evenement = (code: string, type: "absence" | "presence", autres: Partial<EvenementCompteur> = {}): EvenementCompteur => ({
  code,
  type,
  priorite: 10,
  neutralisePointage: false,
  debut: "2026-11-16",
  fin: "2026-11-16",
  debutMinutes: null,
  finMinutes: null,
  ...autres,
});
const journee = (evenements: EvenementCompteur[] | undefined, autres: Partial<JourService> = {}): JourService => ({ jour: "2026-11-16", horaire: HORAIRE, pointages: [], evenements, ...autres });

describe("variables d'événement d'une journée", () => {
  it("compte la durée prévue de l'absence retenue en journée entière", () => {
    const valeurs = variablesDuJour(journee([evenement("CP", "absence")]), CODES);
    assert.equal(valeurs.DUREE_ABSENCE_MIN, 480);
    assert.equal(valeurs.JOURS_ABSENCE, 1);
    assert.equal(valeurs.JOURS_CP, 1);
    assert.equal(valeurs.MIN_CP, 480);
    assert.equal(valeurs.DUREE_EVT_PRESENCE_MIN, 0);
  });

  it("retient la plus grande priorité : la maladie l'emporte sur le congé", () => {
    const valeurs = variablesDuJour(journee([evenement("CP", "absence"), evenement("MAL", "absence", { priorite: 50 })]), CODES);
    assert.equal(valeurs.JOURS_MAL, 1);
    assert.equal(valeurs.JOURS_CP, 0);
    assert.equal(valeurs.DUREE_ABSENCE_MIN, 480);
  });

  it("un pointage écarte l'événement, sauf s'il neutralise le pointage", () => {
    const pointe = { pointages: [480, 1020] };
    assert.equal(variablesDuJour(journee([evenement("CP", "absence")], pointe), CODES).JOURS_CP, 0);
    const formation = evenement("FOR", "presence", { neutralisePointage: true });
    assert.equal(variablesDuJour(journee([formation], pointe), CODES).DUREE_EVT_PRESENCE_MIN, 480);
  });

  it("un jour de repos ne retient aucun événement", () => {
    const valeurs = variablesDuJour(journee([evenement("CP", "absence")], { horaire: null }), CODES);
    assert.equal(valeurs.JOURS_ABSENCE, 0);
    assert.equal(valeurs.DUREE_ABSENCE_MIN, 0);
  });

  it("additionne toujours les saisies en heures du jour", () => {
    const recuperation = evenement("REC", "absence", { debutMinutes: 960, finMinutes: 1020 });
    const valeurs = variablesDuJour(journee([recuperation, evenement("CP", "absence")]), CODES);
    assert.equal(valeurs.MIN_REC, 60);
    assert.equal(valeurs.DUREE_ABSENCE_MIN, 540);
    assert.equal(valeurs.JOURS_REC, 0);
  });

  it("garde une durée inconnue sans horaire prévu, jamais 0", () => {
    const valeurs = variablesDuJour(journee([evenement("CP", "absence")], { horaire: null, estSansPlanning: true }), CODES);
    assert.equal(valeurs.JOURS_CP, 1);
    assert.equal(valeurs.MIN_CP, null);
  });

  it("laisse tout inconnu quand les événements ne sont pas chargés", () => {
    const valeurs = variablesEvenementsDuJour({ jour: "2026-11-16", dureePrevue: 480, aPointe: false, estRepos: false }, CODES);
    assert.equal(valeurs.DUREE_ABSENCE_MIN, null);
    assert.equal(valeurs.JOURS_MAL, null);
  });

  it("additionne les variables des codes sur la semaine", () => {
    const jours = [variablesDuJour(journee([evenement("MAL", "absence")]), CODES), variablesDuJour(journee([], { jour: "2026-11-17" }), CODES)];
    const cumul = agregerJours(jours, CODES);
    assert.equal(cumul.JOURS_MAL, 1);
    assert.equal(cumul.MIN_MAL, 480);
  });
});

describe("variables des codes et des droits", () => {
  it("existent seulement pour les codes connus", () => {
    const noms = variablesPour("MOIS", CODES);
    assert.ok(noms.includes("JOURS_MAL") && noms.includes("PRIS_CP") && noms.includes("SOLDE_CP"));
    assert.ok(!noms.includes("PRIS_MAL"));
    assert.ok(!variablesPour("MOIS").includes("JOURS_MAL"));
  });

  it("lit l'état des droits à la fin de la période, sans l'additionner", () => {
    const compteur = { id: "c", version: 1, formule: "SOLDE_CP", periodicites: ["MOIS"] as const };
    const periode = { periodicite: "MOIS" as const, debut: "2026-11-01", fin: "2026-11-30", finCalcul: "2026-11-16" };
    const contexte = { codes: CODES, droitsAu: (jour: string) => ({ PRIS_CP: 2, SOLDE_CP: jour === "2026-11-16" ? 16 : 0 }) };
    const [valeur] = calculerCompteurs([compteur], [periode], [journee([])], new Map(), contexte);
    assert.equal(valeur.ok && valeur.valeur, 16);
  });
});

describe("durée de nuit (21 h à 6 h)", () => {
  it("compte la présence avant 6 h et après 21 h", () => {
    assert.equal(minutesDeNuit(300, 840, 360, 1260), 60);
    assert.equal(minutesDeNuit(840, 1350, 360, 1260), 90);
    assert.equal(minutesDeNuit(480, 1020, 360, 1260), 0);
    assert.equal(minutesDeNuit(480, null, 360, 1260), null);
  });
});
