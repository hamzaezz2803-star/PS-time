import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { JourService } from "./compteurs/variables.ts";
import {
  arriveesParHeure,
  bilanDuJour,
  cumulerBilans,
  estEnPoste,
  presenceParDepartement,
  statutDuJour,
  tauxPresence,
  type EmployeStatistiques,
} from "./statistiques-presence.ts";

const JOUR = "2026-11-18";
const HORAIRE = { debutPrevu: 480, finPrevue: 1020, dureePrevue: 480, estBadge: true }; // 08:00 - 17:00
const MIDI = { jour: JOUR, minute: 720 };

const journee = (pointages: number[], horaire: JourService["horaire"] = HORAIRE, jour = JOUR): JourService => ({ jour, horaire, pointages });
const employe = (id: string, departement: string, jours: JourService[], fin: string | null = null): EmployeStatistiques => ({
  id,
  departement,
  debutEmploi: null,
  finEmploi: fin,
  jours,
});

describe("statutDuJour", () => {
  it("distingue à l'heure, en retard et sans horaire", () => {
    assert.equal(statutDuJour(journee([480, 1020]), MIDI), "a_l_heure");
    assert.equal(statutDuJour(journee([470]), MIDI), "a_l_heure");
    assert.equal(statutDuJour(journee([495, 1020]), MIDI), "en_retard");
    assert.equal(statutDuJour(journee([], null), MIDI), "sans_horaire");
  });

  it("n'appelle pas absent quelqu'un dont l'heure d'arrivée n'est pas passée", () => {
    assert.equal(statutDuJour(journee([]), { jour: JOUR, minute: 420 }), "attendu");
    assert.equal(statutDuJour(journee([]), MIDI), "absent");
    // Un jour passé sans pointage est une absence, quelle que soit l'heure actuelle.
    assert.equal(statutDuJour(journee([], HORAIRE, "2026-11-17"), { jour: JOUR, minute: 0 }), "absent");
  });

  it("compte présent un profil non badgé", () => {
    assert.equal(statutDuJour(journee([], { ...HORAIRE, estBadge: false }), MIDI), "a_l_heure");
  });
});

describe("bilanDuJour et tauxPresence", () => {
  const equipe = [
    employe("a", "Atelier", [journee([480, 1050])]),
    employe("b", "Atelier", [journee([500, 1020])]),
    employe("c", "Bureau", [journee([])]),
    employe("d", "Bureau", [journee([], null)]),
    employe("e", "Bureau", [journee([480])], "2026-11-01"), // parti avant ce jour : ignoré
  ];

  it("compte chaque statut et additionne les minutes", () => {
    const bilan = bilanDuJour(equipe, JOUR, MIDI);
    assert.deepEqual(
      { effectif: bilan.effectif, prevus: bilan.prevus, aLHeure: bilan.aLHeure, enRetard: bilan.enRetard, absents: bilan.absents },
      { effectif: 4, prevus: 3, aLHeure: 1, enRetard: 1, absents: 1 },
    );
    assert.equal(bilan.minutesRetard, 20);
    assert.equal(bilan.minutesSupplementaires, 30);
    assert.equal(bilan.minutesTravaillees, 570 + 520);
  });

  it("donne le taux sur les seuls attendus déjà échus, null si personne", () => {
    assert.equal(tauxPresence(bilanDuJour(equipe, JOUR, MIDI)), 66.7);
    assert.equal(tauxPresence({ aLHeure: 0, enRetard: 0, absents: 0 }), null);
  });

  it("cumule plusieurs jours", () => {
    const bilan = bilanDuJour(equipe, JOUR, MIDI);
    const cumul = cumulerBilans([bilan, bilan]);
    assert.equal(cumul.absents, 2);
    assert.equal(cumul.minutesRetard, 40);
  });

  it("respecte la période d'emploi", () => {
    assert.equal(estEnPoste({ debutEmploi: "2026-11-19", finEmploi: null }, JOUR), false);
    assert.equal(estEnPoste({ debutEmploi: JOUR, finEmploi: JOUR }, JOUR), true);
  });
});

describe("presenceParDepartement", () => {
  it("donne le taux par département, sans les attendus ni les jours sans horaire", () => {
    const equipe = [
      employe("a", "Atelier", [journee([480])]),
      employe("b", "Atelier", [journee([])]),
      employe("c", "Bureau", [journee([], { ...HORAIRE, debutPrevu: 840 })]),
      employe("d", "Bureau", [journee([], null)]),
    ];
    assert.deepEqual(presenceParDepartement(equipe, MIDI), [{ departement: "Atelier", prevus: 2, presents: 1, taux: 50 }]);
  });
});

describe("arriveesParHeure", () => {
  it("range les premiers pointages par heure, heures vides comprises", () => {
    const equipe = [employe("a", "A", [journee([475, 1020])]), employe("b", "A", [journee([600])]), employe("c", "A", [journee([])])];
    assert.deepEqual(arriveesParHeure(equipe, JOUR), [
      { heure: 7, arrivees: 1 },
      { heure: 8, arrivees: 0 },
      { heure: 9, arrivees: 0 },
      { heure: 10, arrivees: 1 },
    ]);
    assert.deepEqual(arriveesParHeure([], JOUR), []);
  });
});
