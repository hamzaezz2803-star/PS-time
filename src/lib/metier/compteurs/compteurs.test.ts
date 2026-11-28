import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ProfilHoraire } from "../../../types/index.ts";
import { TEXTES_VARIABLES } from "../../textes/variables-compteurs.ts";
import { PLAGES_JOURNEE_TYPE } from "../profil-horaire.ts";
import { calculerCompteurs, type CacheFormules, type DefinitionCompteur } from "./calcul.ts";
import { joursEntre, moisDe, periodesDeLaDate, semaineDe } from "./periodes.ts";
import { agregerJours, horaireDuProfil, VARIABLES_COMPTEURS, variablesDuJour, variablesPour, type HorairePrevu, type JourService } from "./variables.ts";

// Données fictives. 08:00-12:00 et 14:00-18:00 fixes (journée type) : 480 minutes prévues.
const h = (heures: number, minutes = 0) => heures * 60 + minutes;
const JOURNEE: HorairePrevu = { debutPrevu: h(8), finPrevue: h(18), dureePrevue: 480, estBadge: true };
const jour = (date: string, pointages: number[], horaire: HorairePrevu | null = JOURNEE): JourService => ({ jour: date, horaire, pointages });

describe("périodes", () => {
  it("semaine du lundi au dimanche, même à cheval sur deux mois", () => {
    assert.deepEqual(semaineDe("2026-11-18"), { debut: "2026-11-16", fin: "2026-11-22" });
    assert.deepEqual(semaineDe("2026-11-22"), { debut: "2026-11-16", fin: "2026-11-22" });
    assert.deepEqual(semaineDe("2026-12-01"), { debut: "2026-11-30", fin: "2026-12-06" });
  });

  it("mois complet, février bissextile compris", () => {
    assert.deepEqual(moisDe("2026-11-17"), { debut: "2026-11-01", fin: "2026-11-30" });
    assert.deepEqual(moisDe("2028-02-10"), { debut: "2028-02-01", fin: "2028-02-29" });
    assert.equal(joursEntre("2026-12-30", "2027-01-02").length, 4);
  });

  it("s'arrête aux jours écoulés et ne calcule rien pour une date future", () => {
    const periodes = periodesDeLaDate("2026-11-17", "2026-11-18");
    assert.deepEqual(periodes.map((p) => [p.periodicite, p.debut, p.finCalcul]), [
      ["JOUR", "2026-11-17", "2026-11-17"],
      ["SEMAINE", "2026-11-16", "2026-11-18"],
      ["MOIS", "2026-11-01", "2026-11-18"],
    ]);
    assert.equal(periodesDeLaDate("2026-10-05", "2026-11-18")[2].finCalcul, "2026-10-31");
    assert.deepEqual(periodesDeLaDate("2026-11-19", "2026-11-18"), []);
  });
});

describe("variables d'une journée", () => {
  it("calcule durées, retard et départ anticipé", () => {
    const valeurs = variablesDuJour(jour("2026-11-16", [h(8, 12), h(12), h(14), h(17, 50)]));
    assert.deepEqual(valeurs, {
      DUREE_PREVUE_MIN: 480,
      DUREE_TRAVAILLEE_MIN: 578,
      RETARD_MIN: 12,
      AVANCE_MIN: 0,
      DEPART_ANTICIPE_MIN: 10,
      DEPASSEMENT_MIN: 0,
      NB_POINTAGES: 4,
      A_HORAIRE: 1,
      PRESENT: 1,
      DUREE_NUIT_MIN: 0,
      // Événements non chargés : variables d'événement inconnues, jamais 0.
      DUREE_ABSENCE_MIN: null,
      DUREE_EVT_PRESENCE_MIN: null,
      JOURS_ABSENCE: null,
    });
  });

  it("calcule l'avance et le dépassement (pointages dans le désordre)", () => {
    const valeurs = variablesDuJour(jour("2026-11-16", [h(18, 30), h(7, 45)]));
    assert.equal(valeurs.AVANCE_MIN, 15);
    assert.equal(valeurs.RETARD_MIN, 0);
    assert.equal(valeurs.DEPASSEMENT_MIN, 30);
  });

  it("laisse inconnu ce qui ne peut pas être calculé, jamais 0", () => {
    const seul = variablesDuJour(jour("2026-11-16", [h(8)]));
    assert.equal(seul.DUREE_TRAVAILLEE_MIN, null);
    assert.equal(seul.DEPART_ANTICIPE_MIN, null);
    const absent = variablesDuJour(jour("2026-11-16", []));
    assert.equal(absent.RETARD_MIN, null);
    assert.equal(absent.PRESENT, 0);
    const sansHoraire = variablesDuJour(jour("2026-11-22", [h(9), h(11)], null));
    assert.equal(sansHoraire.DUREE_PREVUE_MIN, null);
    assert.equal(sansHoraire.RETARD_MIN, null);
    assert.equal(sansHoraire.DUREE_TRAVAILLEE_MIN, 120);
    assert.equal(sansHoraire.A_HORAIRE, 0);
  });

  it("considère présent aux heures prévues un profil non badgé", () => {
    const valeurs = variablesDuJour(jour("2026-11-16", [], { ...JOURNEE, estBadge: false }));
    assert.equal(valeurs.PRESENT, 1);
    assert.equal(valeurs.DUREE_TRAVAILLEE_MIN, 600);
    assert.equal(valeurs.RETARD_MIN, 0);
    assert.equal(valeurs.NB_POINTAGES, 0);
  });

  it("déduit l'horaire prévu d'un profil : plages fixes", () => {
    const profil: ProfilHoraire = { id: "j8", code: "J8", nom: "Journée", type: "travail", estBadge: true, repasMinimumMinutes: null, repasMaximumMinutes: null, plages: PLAGES_JOURNEE_TYPE };
    const horaire = horaireDuProfil(profil);
    assert.ok(horaire);
    assert.equal(horaire.dureePrevue, profil.plages.filter((p) => p.type === "fixe").reduce((t, p) => t + p.fin - p.debut, 0));
    assert.ok(horaire.debutPrevu < horaire.finPrevue);
  });
});

describe("cumuls semaine et mois", () => {
  it("additionne les seuls jours connus et compte les jours", () => {
    const jours = [
      variablesDuJour(jour("2026-11-16", [h(8, 10), h(18)])),
      variablesDuJour(jour("2026-11-17", [h(8, 5)])),
      variablesDuJour(jour("2026-11-18", [])),
      variablesDuJour(jour("2026-11-21", [], null)),
    ];
    const cumul = agregerJours(jours);
    assert.equal(cumul.RETARD_MIN, 15);
    assert.equal(cumul.DUREE_TRAVAILLEE_MIN, 590);
    assert.equal(cumul.DUREE_PREVUE_MIN, 1440);
    assert.equal(cumul.NB_JOURS, 4);
    assert.equal(cumul.NB_JOURS_PLANIFIES, 3);
    assert.equal(cumul.NB_JOURS_TRAVAILLES, 2);
    assert.equal(cumul.NB_ABSENCES, 1);
    assert.equal(cumul.NB_JOURS_INCOMPLETS, 1);
  });

  it("reste inconnu si aucun jour n'est connu", () => {
    const cumul = agregerJours([variablesDuJour(jour("2026-11-16", [], null))]);
    assert.equal(cumul.RETARD_MIN, null);
    assert.equal(cumul.NB_POINTAGES, 0);
  });

  it("chaque variable existe dans sa périodicité et a un texte d'aide", () => {
    assert.ok(variablesPour("JOUR").includes("PRESENT"));
    assert.ok(!variablesPour("SEMAINE").includes("PRESENT"));
    assert.ok(variablesPour("MOIS").includes("NB_ABSENCES"));
    assert.ok(!variablesPour("JOUR").includes("NB_ABSENCES"));
    for (const variable of VARIABLES_COMPTEURS) assert.ok(TEXTES_VARIABLES[variable.nom].libelle);
  });
});

describe("calcul des compteurs", () => {
  const periodes = periodesDeLaDate("2026-11-18", "2026-11-18");
  const jours = [
    jour("2026-11-16", [h(8, 10), h(18)]),
    jour("2026-11-17", [h(8, 20), h(17)]),
    jour("2026-11-18", [h(9)]),
    ...joursEntre("2026-11-01", "2026-11-15").map((date) => jour(date, [], null)),
  ];
  const compteur = (id: string, formule: string, periodicites: DefinitionCompteur["periodicites"]): DefinitionCompteur => ({ id, version: 1, formule, periodicites });

  it("calcule chaque compteur sur ses périodicités", () => {
    const valeurs = calculerCompteurs([compteur("RETARD", "RETARD_MIN", ["JOUR", "SEMAINE", "MOIS"])], periodes, jours);
    assert.deepEqual(
      valeurs.map((v) => [v.periodicite, v.ok && v.valeur]),
      [["JOUR", 60], ["SEMAINE", 90], ["MOIS", 90]],
    );
  });

  it("signale une donnée manquante au lieu d'inventer 0", () => {
    const [valeur] = calculerCompteurs([compteur("DUREE", "DUREE_TRAVAILLEE_MIN", ["JOUR"])], periodes, jours);
    assert.equal(!valeur.ok && valeur.erreur.code, "DONNEE_MANQUANTE");
  });

  it("refuse une variable qui n'existe pas pour la périodicité", () => {
    const valeurs = calculerCompteurs([compteur("ABS", "NB_ABSENCES", ["JOUR", "MOIS"])], periodes, jours);
    assert.equal(!valeurs[0].ok && valeurs[0].erreur.code, "VARIABLE_INCONNUE");
    assert.equal(valeurs[1].ok && valeurs[1].valeur, 0);
  });

  it("arrondit à 4 décimales et réutilise les formules compilées", () => {
    const cache: CacheFormules = new Map();
    const [valeur] = calculerCompteurs([compteur("TIERS", "RETARD_MIN / 7", ["JOUR"])], periodes, jours, cache);
    assert.equal(valeur.ok && valeur.valeur, 8.5714);
    calculerCompteurs([compteur("TIERS", "RETARD_MIN / 7", ["JOUR"])], periodes, jours, cache);
    assert.equal(cache.size, 1);
  });
});

describe("historique journalier", () => {
  it("calcule chaque jour les seuls compteurs journaliers", async () => {
    const { historiqueJournalier } = await import("./calcul.ts");
    const compteurs: DefinitionCompteur[] = [
      { id: "RETARD", version: 1, formule: "RETARD_MIN", periodicites: ["JOUR", "MOIS"] },
      { id: "ABSENCES", version: 1, formule: "NB_ABSENCES", periodicites: ["MOIS"] },
    ];
    const historique = historiqueJournalier(compteurs, [jour("2026-11-16", [h(8, 10), h(18)]), jour("2026-11-17", [])]);
    assert.deepEqual(historique.map((j) => [j.jour, j.valeurs.map((v) => [v.idCompteur, v.ok ? v.valeur : v.erreur.code])]), [
      ["2026-11-16", [["RETARD", 10]]],
      ["2026-11-17", [["RETARD", "DONNEE_MANQUANTE"]]],
    ]);
  });
});
