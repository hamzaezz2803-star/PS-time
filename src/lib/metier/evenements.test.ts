import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { estPrisAutoriseLe, trierPeriodes, verifierPeriodesPrise } from "./evenements.ts";

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
