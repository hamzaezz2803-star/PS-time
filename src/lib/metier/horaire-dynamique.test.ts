import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ProfilHoraire } from "../../types/index.ts";
import {
  clePremierPointage,
  jourIso,
  joursVersTexte,
  normaliserJours,
  premiersPointages,
  regleEnConflit,
  regleReconnue,
  reglesSeChevauchent,
  texteVersJours,
  type RegleHoraire,
} from "./horaire-dynamique.ts";
import { planningDuJour, type DonneesPlanning } from "./planning-jour.ts";
import { PLAGES_JOURNEE_TYPE } from "./profil-horaire.ts";

// Données fictives.
const h = (heures: number, minutes = 0) => heures * 60 + minutes;
const regle = (id: string, debut: number, fin: number, jours = [1, 2, 3, 4, 5, 6, 7], estActif = true): RegleHoraire => ({
  id,
  debut,
  fin,
  jours,
  profilId: `profil-${id}`,
  estActif,
});

// Lundi 16 novembre 2026, samedi 21, dimanche 22.
const LUNDI = "2026-11-16";
const SAMEDI = "2026-11-21";

describe("jours de la semaine", () => {
  it("normalise : valides, sans doublon, triés, et vide = tous les jours", () => {
    assert.deepEqual(normaliserJours([5, 1, 5, 9, 0]), [1, 5]);
    assert.deepEqual(normaliserJours([]), [1, 2, 3, 4, 5, 6, 7]);
  });

  it("passe du texte enregistré à la liste et inversement", () => {
    assert.equal(joursVersTexte([3, 1, 2]), "123");
    assert.deepEqual(texteVersJours("135"), [1, 3, 5]);
  });

  it("donne le jour ISO : lundi = 1, dimanche = 7", () => {
    assert.equal(jourIso(LUNDI), 1);
    assert.equal(jourIso("2026-11-22"), 7);
  });
});

describe("chevauchement des règles", () => {
  it("croise deux fenêtres qui se recouvrent le même jour", () => {
    assert.equal(reglesSeChevauchent(regle("a", h(6), h(8)), regle("b", h(7), h(9))), true);
  });

  it("accepte deux fenêtres bout à bout (fin exclue)", () => {
    assert.equal(reglesSeChevauchent(regle("a", h(6), h(8)), regle("b", h(8), h(10))), false);
  });

  it("accepte la même fenêtre sur des jours différents", () => {
    assert.equal(reglesSeChevauchent(regle("a", h(6), h(8), [1, 2, 3, 4, 5]), regle("b", h(6), h(8), [6, 7])), false);
  });

  it("ignore une règle inactive", () => {
    assert.equal(reglesSeChevauchent(regle("a", h(6), h(8)), regle("b", h(6), h(8), undefined, false)), false);
  });

  it("ne compare pas une règle avec elle-même (modification)", () => {
    const existante = regle("a", h(6), h(8));
    assert.equal(regleEnConflit({ ...existante, fin: h(9) }, [existante]), null);
    assert.equal(regleEnConflit(regle("b", h(7), h(9)), [existante])?.id, "a");
  });
});

describe("règle reconnue", () => {
  const regles = [regle("matin", h(5), h(9), [1, 2, 3, 4, 5]), regle("samedi", h(5), h(9), [6]), regle("soir", h(13), h(15))];

  it("prend la règle dont la fenêtre et le jour conviennent", () => {
    assert.equal(regleReconnue(regles, LUNDI, h(7, 45))?.id, "matin");
    assert.equal(regleReconnue(regles, SAMEDI, h(7, 45))?.id, "samedi");
    assert.equal(regleReconnue(regles, LUNDI, h(14))?.id, "soir");
  });

  it("borne : début inclus, fin exclue", () => {
    assert.equal(regleReconnue(regles, LUNDI, h(5))?.id, "matin");
    assert.equal(regleReconnue(regles, LUNDI, h(9)), null);
  });

  it("n'invente rien : aucune règle, ou une règle inactive", () => {
    assert.equal(regleReconnue(regles, LUNDI, h(11)), null);
    assert.equal(regleReconnue([regle("x", h(5), h(9), undefined, false)], LUNDI, h(6)), null);
  });

  it("ne devine pas quand plusieurs règles conviennent", () => {
    assert.equal(regleReconnue([regle("a", h(5), h(9)), regle("b", h(6), h(8))], LUNDI, h(7)), null);
  });
});

describe("premiers pointages", () => {
  it("garde la plus petite minute par employé et par jour", () => {
    const premiers = premiersPointages([
      { employeId: "e1", jour: LUNDI, minutes: h(12) },
      { employeId: "e1", jour: LUNDI, minutes: h(7, 50) },
      { employeId: "e2", jour: LUNDI, minutes: h(14) },
    ]);
    assert.equal(premiers.get(clePremierPointage("e1", LUNDI)), h(7, 50));
    assert.equal(premiers.get(clePremierPointage("e2", LUNDI)), h(14));
  });
});

describe("planning du jour avec horaire dynamique", () => {
  const profil = (id: string): ProfilHoraire => ({
    id,
    code: id.toUpperCase().slice(0, 3),
    nom: id,
    type: "travail",
    estBadge: true,
    repasMinimumMinutes: null,
    repasMaximumMinutes: null,
    plages: PLAGES_JOURNEE_TYPE,
  });
  const donnees = (premiers: [string, number][]): DonneesPlanning => ({
    affectations: [{ rotationId: "rot", groupeId: null, employeId: "e1", dateDebut: "2026-01-01", dateFin: null }],
    rotations: new Map([["rot", { id: "rot", nom: "Rotation", type: "cycle", nombreJours: 1, jours: { 0: "profil-rotation" } }]]),
    profils: new Map([profil("profil-matin"), profil("profil-rotation")].map((p) => [p.id, p])),
    horaireDynamique: { regles: [regle("matin", h(5), h(9))], premiersPointages: new Map(premiers) },
  });
  const employe = { id: "e1", groupeId: null };

  it("la règle reconnue passe avant la rotation", () => {
    const planning = planningDuJour(employe, LUNDI, donnees([[clePremierPointage("e1", LUNDI), h(7)]]));
    assert.equal(planning.type === "travail" && planning.profil.id, "profil-matin");
  });

  it("sans règle reconnue, on garde la rotation", () => {
    const planning = planningDuJour(employe, LUNDI, donnees([[clePremierPointage("e1", LUNDI), h(11)]]));
    assert.equal(planning.type === "travail" && planning.profil.id, "profil-rotation");
  });

  it("sans pointage (ou sans horaire dynamique), on garde la rotation", () => {
    const planning = planningDuJour(employe, LUNDI, donnees([]));
    assert.equal(planning.type === "travail" && planning.profil.id, "profil-rotation");
  });
});
