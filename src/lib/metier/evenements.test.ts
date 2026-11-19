import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { couvreLaJournee, estDansUnePeriodePrise, estPrisAutoriseLe, nombreDeJours, saisiesSeChevauchent, trierPeriodes, verifierPeriodesPrise } from "./evenements.ts";

describe("périodes de prise d'un événement", () => {
  it("accepte aucune période (toute l'année) ou des périodes distinctes", () => {
    assert.equal(verifierPeriodesPrise([]), null);
    assert.equal(
      verifierPeriodesPrise([
        { debut: "2026-01-01", fin: "2026-06-30" },
        { debut: "2026-09-01", fin: "2026-09-01" },
      ]),
      null,
    );
  });

  it("refuse une fin avant le début", () => {
    assert.equal(verifierPeriodesPrise([{ debut: "2026-07-01", fin: "2026-06-30" }]), "ordre");
  });

  it("refuse deux périodes qui ont un jour en commun", () => {
    assert.equal(
      verifierPeriodesPrise([
        { debut: "2026-01-01", fin: "2026-03-31" },
        { debut: "2026-03-31", fin: "2026-05-31" },
      ]),
      "chevauchement",
    );
  });

  it("refuse plus de 4 périodes", () => {
    const periodes = ["01", "02", "03", "04", "05"].map((mois) => ({ debut: `2026-${mois}-01`, fin: `2026-${mois}-10` }));
    assert.equal(verifierPeriodesPrise(periodes), "trop");
  });
});

describe("prise autorisée un jour donné", () => {
  const congesReportes = [{ debut: "2026-01-01", fin: "2026-07-01" }];

  it("autorise tous les jours sans période", () => {
    assert.equal(estPrisAutoriseLe([], "2026-11-19"), true);
  });

  it("autorise les bornes et refuse le lendemain de la fin", () => {
    assert.equal(estPrisAutoriseLe(congesReportes, "2026-01-01"), true);
    assert.equal(estPrisAutoriseLe(congesReportes, "2026-07-01"), true);
    assert.equal(estPrisAutoriseLe(congesReportes, "2026-07-02"), false);
  });

  it("range les périodes dans l'ordre du calendrier", () => {
    const triees = trierPeriodes([
      { debut: "2026-09-01", fin: "2026-09-30" },
      { debut: "2026-02-01", fin: "2026-02-28" },
    ]);
    assert.deepEqual(triees.map((periode) => periode.debut), ["2026-02-01", "2026-09-01"]);
  });
});

describe("saisies d'événements d'un employé", () => {
  const conge = { debut: "2026-12-01", fin: "2026-12-05", debutMinutes: null, finMinutes: null };
  const rendezVous = (debutMinutes: number, finMinutes: number, jour = "2026-12-10") => ({ debut: jour, fin: jour, debutMinutes, finMinutes });

  it("refuse deux saisies qui ont un jour en commun dès que l'une est en journées entières", () => {
    assert.equal(saisiesSeChevauchent(conge, { ...conge, debut: "2026-12-05", fin: "2026-12-08" }), true);
    assert.equal(saisiesSeChevauchent(conge, rendezVous(600, 720, "2026-12-03")), true);
    assert.equal(saisiesSeChevauchent(conge, { ...conge, debut: "2026-12-06", fin: "2026-12-08" }), false);
  });

  it("accepte deux saisies en heures le même jour si les heures ne se croisent pas (fin exclue)", () => {
    assert.equal(saisiesSeChevauchent(rendezVous(600, 720), rendezVous(720, 780)), false);
    assert.equal(saisiesSeChevauchent(rendezVous(600, 720), rendezVous(700, 780)), true);
  });

  it("exige que toute la saisie tienne dans une période de prise", () => {
    const periodes = [{ debut: "2026-01-01", fin: "2026-06-30" }];
    assert.equal(estDansUnePeriodePrise([], "2026-12-01", "2026-12-05"), true);
    assert.equal(estDansUnePeriodePrise(periodes, "2026-06-25", "2026-06-30"), true);
    assert.equal(estDansUnePeriodePrise(periodes, "2026-06-25", "2026-07-02"), false);
  });

  it("dit si un jour est couvert en entier et compte les jours", () => {
    assert.equal(couvreLaJournee(conge, "2026-12-01"), true);
    assert.equal(couvreLaJournee(conge, "2026-12-06"), false);
    assert.equal(couvreLaJournee(rendezVous(600, 720), "2026-12-10"), false);
    assert.equal(nombreDeJours(conge), 5);
    assert.equal(nombreDeJours(rendezVous(600, 720)), 1);
  });
});
