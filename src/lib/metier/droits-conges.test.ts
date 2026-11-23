import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { anneeCivile, bilanDroit, calculerReports, estNombreDeJoursValide, estValeurValidePourUnite, etatSolde, joursDecomptes, pourcentageConsomme, type DroitAReporter } from "./droits-conges.ts";

const ANNEE_2026 = { debut: "2026-01-01", fin: "2026-12-31", joursAcquis: 18, joursReliquat: 3 };
const journees = (debut: string, fin: string) => ({ debut, fin, debutMinutes: null, finMinutes: null });
const aucunRepos = () => false;
// 2026-11-21 est un samedi, 2026-11-22 un dimanche.
const weekEnd = (jour: string) => jour === "2026-11-21" || jour === "2026-11-22";
// Valeur d'un jour d'absence en jours : 1, ou 0 un jour de week-end.
const unParJour = () => 1;
const horsWeekEnd = (jour: string) => (weekEnd(jour) ? 0 : 1);

describe("jours décomptés d'une absence", () => {
  it("compte chaque jour d'une absence en journées entières", () => {
    assert.deepEqual(joursDecomptes(journees("2026-03-02", "2026-03-04"), ANNEE_2026, aucunRepos), ["2026-03-02", "2026-03-03", "2026-03-04"]);
  });

  it("ne compte pas les jours de repos du planning", () => {
    assert.equal(joursDecomptes(journees("2026-11-19", "2026-11-24"), ANNEE_2026, weekEnd).length, 4);
  });

  it("ne garde que les jours compris dans la période du droit", () => {
    assert.deepEqual(joursDecomptes(journees("2025-12-30", "2026-01-02"), ANNEE_2026, aucunRepos), ["2026-01-01", "2026-01-02"]);
  });

  it("ignore une saisie en heures", () => {
    assert.deepEqual(joursDecomptes({ debut: "2026-03-02", fin: "2026-03-02", debutMinutes: 600, finMinutes: 720 }, ANNEE_2026, aucunRepos), []);
  });
});

describe("bilan d'un droit", () => {
  it("additionne reliquat et acquis, sépare les jours pris des jours prévus", () => {
    const bilan = bilanDroit(ANNEE_2026, [journees("2026-03-02", "2026-03-06"), journees("2026-11-20", "2026-11-25")], "2026-11-21", unParJour);
    assert.equal(bilan.acquis, 21);
    assert.equal(bilan.pris, 5 + 2);
    assert.equal(bilan.prevus, 4);
    assert.equal(bilan.soldeAujourdhui, 14);
    assert.equal(bilan.soldePrevisionnel, 10);
    assert.equal(bilan.absences.length, 2);
  });

  it("écarte les absences sans aucun jour décompté", () => {
    const bilan = bilanDroit(ANNEE_2026, [journees("2026-11-21", "2026-11-22")], "2026-11-21", horsWeekEnd);
    assert.equal(bilan.absences.length, 0);
    assert.equal(bilan.soldePrevisionnel, 21);
  });

  it("donne un solde négatif quand on prend plus que l'acquis", () => {
    const bilan = bilanDroit({ ...ANNEE_2026, joursAcquis: 1.5, joursReliquat: 0 }, [journees("2026-03-02", "2026-03-03")], "2026-11-21", unParJour);
    assert.equal(bilan.soldePrevisionnel, -0.5);
    assert.equal(etatSolde(bilan.soldePrevisionnel), "depasse");
  });
});

describe("affichage du solde", () => {
  it("donne l'état du solde", () => {
    assert.equal(etatSolde(4), "disponible");
    assert.equal(etatSolde(0), "epuise");
    assert.equal(etatSolde(-1), "depasse");
  });

  it("borne la part consommée entre 0 et 100", () => {
    assert.equal(pourcentageConsomme({ acquis: 20, pris: 5, prevus: 5 }), 50);
    assert.equal(pourcentageConsomme({ acquis: 2, pris: 5, prevus: 0 }), 100);
    assert.equal(pourcentageConsomme({ acquis: 0, pris: 0, prevus: 0 }), 0);
  });

  it("accepte les demi-journées, refuse le reste", () => {
    assert.equal(estNombreDeJoursValide(18, 366), true);
    assert.equal(estNombreDeJoursValide(2.5, 366), true);
    assert.equal(estNombreDeJoursValide(2.25, 366), false);
    assert.equal(estNombreDeJoursValide(-1, 366), false);
    assert.equal(estNombreDeJoursValide(400, 366), false);
  });
});

describe("période d'un droit", () => {
  it("reconnaît une année civile entière", () => {
    assert.equal(anneeCivile("2026-01-01", "2026-12-31"), 2026);
    assert.equal(anneeCivile("2026-01-01", "2026-06-30"), null);
    assert.equal(anneeCivile("2026-06-01", "2027-05-31"), null);
  });
});

describe("fiche complète d'un droit", () => {
  it("additionne reliquat, droit et suppléments dans le total", () => {
    const bilan = bilanDroit({ ...ANNEE_2026, joursAcquis: 21, joursReliquat: 2, supplements: 1 + 2 + 0 }, [], "2026-11-21", unParJour);
    assert.equal(bilan.total, 26);
    assert.equal(bilan.soldePrevisionnel, 26);
  });

  it("ne rend rien utilisable tant que le droit est provisoire", () => {
    const bilan = bilanDroit({ ...ANNEE_2026, estConfirme: false }, [journees("2026-03-02", "2026-03-03")], "2026-11-21", unParJour);
    assert.equal(bilan.total, 21);
    assert.equal(bilan.acquis, 0);
    assert.equal(bilan.soldePrevisionnel, -2);
  });

  it("en heures : un jour entier vaut sa durée prévue, une saisie en heures compte ses heures", () => {
    const enHeures = { ...ANNEE_2026, joursAcquis: 40, joursReliquat: 0, unite: "heures" as const };
    const huitHeures = (jour: string) => (weekEnd(jour) ? 0 : 8);
    const rendezVous = { debut: "2026-12-01", fin: "2026-12-01", debutMinutes: 600, finMinutes: 690 };
    const bilan = bilanDroit(enHeures, [journees("2026-11-19", "2026-11-22"), rendezVous], "2026-11-21", huitHeures);
    assert.equal(bilan.pris, 16);
    assert.equal(bilan.prevus, 1.5);
    assert.equal(bilan.soldePrevisionnel, 22.5);
  });

  it("ignore une saisie en heures pour un droit en jours", () => {
    const rendezVous = { debut: "2026-03-02", fin: "2026-03-02", debutMinutes: 600, finMinutes: 720 };
    assert.equal(bilanDroit(ANNEE_2026, [rendezVous], "2026-11-21", unParJour).absences.length, 0);
  });

  it("vérifie la valeur selon l'unité", () => {
    assert.equal(estValeurValidePourUnite(21, "journee", 366), true);
    assert.equal(estValeurValidePourUnite(1.5, "journee", 366), false);
    assert.equal(estValeurValidePourUnite(1.5, "demi_journee", 366), true);
    assert.equal(estValeurValidePourUnite(7.5, "heures", 366), true);
  });
});

describe("report sur la période suivante", () => {
  const droit = (id: string, debut: string, soldeSansReport: number, autres: Partial<DroitAReporter> = {}): DroitAReporter => ({
    id, employeId: "e1", evenementId: "ca", debut, unite: "journee", estReporte: true, estConfirme: true, soldeSansReport, ...autres,
  });

  it("reporte le solde positif sur le droit suivant, et l'enchaîne d'année en année", () => {
    const reports = calculerReports([droit("2027", "2027-01-01", 4), droit("2025", "2025-01-01", 3), droit("2026", "2026-01-01", 2)]);
    assert.equal(reports.get("2025"), 0);
    assert.equal(reports.get("2026"), 3);
    assert.equal(reports.get("2027"), 5);
  });

  it("ne reporte ni un solde négatif, ni sans « Report », ni un droit provisoire, ni d'une autre unité", () => {
    assert.equal(calculerReports([droit("a", "2025-01-01", -2), droit("b", "2026-01-01", 0)]).get("b"), 0);
    assert.equal(calculerReports([droit("a", "2025-01-01", 5, { estReporte: false }), droit("b", "2026-01-01", 0)]).get("b"), 0);
    assert.equal(calculerReports([droit("a", "2025-01-01", 5, { estConfirme: false }), droit("b", "2026-01-01", 0)]).get("b"), 0);
    assert.equal(calculerReports([droit("a", "2025-01-01", 5), droit("b", "2026-01-01", 0, { unite: "heures" })]).get("b"), 0);
  });

  it("garde séparés les employés et les événements", () => {
    const reports = calculerReports([droit("a", "2025-01-01", 5), droit("b", "2026-01-01", 0, { employeId: "e2" }), droit("c", "2026-01-01", 0, { evenementId: "rcp" })]);
    assert.equal(reports.get("b"), 0);
    assert.equal(reports.get("c"), 0);
  });
});
