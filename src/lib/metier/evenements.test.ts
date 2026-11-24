import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { couvreLaJournee, evenementRetenu, heuresEnMinutes, minutesEnHeures, niveauPriorite, nombreDeJours, saisiesSeChevauchent } from "./evenements.ts";

describe("durée d'un événement en heures", () => {
  it("lit un nombre d'heures entier ou décimal (virgule ou point)", () => {
    assert.equal(heuresEnMinutes("2"), 120);
    assert.equal(heuresEnMinutes("1,5"), 90);
    assert.equal(heuresEnMinutes(" 0.5 "), 30);
    assert.equal(heuresEnMinutes("24"), 1440);
  });

  it("refuse zéro, plus de 24 h, un pas autre que la demi-heure et le texte", () => {
    assert.equal(heuresEnMinutes("0"), null);
    assert.equal(heuresEnMinutes("24,5"), null);
    assert.equal(heuresEnMinutes("1,25"), null);
    assert.equal(heuresEnMinutes("deux"), null);
    assert.equal(heuresEnMinutes(""), null);
    assert.equal(heuresEnMinutes("-1"), null);
  });

  it("affiche les minutes en heures avec une virgule", () => {
    assert.equal(minutesEnHeures(90), "1,5");
    assert.equal(minutesEnHeures(120), "2");
  });
});

describe("niveau de priorité", () => {
  it("découpe 0 à 255 en trois tiers", () => {
    assert.equal(niveauPriorite(0), "basse");
    assert.equal(niveauPriorite(84), "basse");
    assert.equal(niveauPriorite(85), "moyenne");
    assert.equal(niveauPriorite(169), "moyenne");
    assert.equal(niveauPriorite(171), "haute");
    assert.equal(niveauPriorite(255), "haute");
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

  it("dit si un jour est couvert en entier et compte les jours", () => {
    assert.equal(couvreLaJournee(conge, "2026-12-01"), true);
    assert.equal(couvreLaJournee(conge, "2026-12-06"), false);
    assert.equal(couvreLaJournee(rendezVous(600, 720), "2026-12-10"), false);
    assert.equal(nombreDeJours(conge), 5);
    assert.equal(nombreDeJours(rendezVous(600, 720)), 1);
  });
});

describe("événement retenu un même jour", () => {
  const conge = { code: "CP", priorite: 10, neutralisePointage: false };
  const maladie = { code: "MAL", priorite: 50, neutralisePointage: false };
  const mission = { code: "MIS", priorite: 30, neutralisePointage: true };

  it("retient la plus grande priorité : la maladie neutralise le congé", () => {
    assert.equal(evenementRetenu([conge, maladie], false), maladie);
    assert.equal(evenementRetenu([maladie, conge, mission], false), maladie);
  });

  it("laisse le pointage l'emporter, sauf sur un événement qui neutralise le pointage", () => {
    assert.equal(evenementRetenu([conge, maladie], true), null);
    assert.equal(evenementRetenu([conge, maladie, mission], true), mission);
  });

  it("garde le premier à priorité égale, et rien sans événement", () => {
    const autreConge = { ...conge, code: "CP2" };
    assert.equal(evenementRetenu([conge, autreConge], false), conge);
    assert.equal(evenementRetenu([], false), null);
  });
});
