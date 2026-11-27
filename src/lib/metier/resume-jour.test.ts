import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resumerJour, type EvenementPeriode } from "./resume-jour.ts";

const JOUR = "2026-11-18";
const HORAIRE = { debutPrevu: 480, finPrevue: 1020, dureePrevue: 480, estBadge: true };
const evenement = (code: string, priorite: number, neutralisePointage = false): EvenementPeriode => ({
  code,
  nom: code,
  type: "absence",
  priorite,
  neutralisePointage,
  debut: "2026-11-16",
  fin: "2026-11-20",
});

describe("resumerJour", () => {
  it("donne entrée, sortie, temps travaillé et retard", () => {
    const resume = resumerJour({ jour: JOUR, horaire: HORAIRE, pointages: [495, 1020], profil: { code: "J8", nom: "Journée", estDynamique: false } }, []);
    assert.deepEqual(
      { profil: resume.profilCode, entree: resume.entree, sortie: resume.sortie, travaille: resume.travailleMinutes, retard: resume.retardMinutes },
      { profil: "J8", entree: 495, sortie: 1020, travaille: 525, retard: 15 },
    );
    assert.equal(resume.evenement, null);
  });

  it("retient l'événement le plus prioritaire et liste les autres comme non validés", () => {
    const resume = resumerJour({ jour: JOUR, horaire: HORAIRE, pointages: [] }, [evenement("CP", 10), evenement("MAL", 50)]);
    assert.equal(resume.evenement?.code, "MAL");
    assert.deepEqual(resume.nonValides.map((element) => element.code), ["CP"]);
  });

  it("laisse un pointage l'emporter et marque un jour de repos sans profil", () => {
    const pointe = resumerJour({ jour: JOUR, horaire: HORAIRE, pointages: [480] }, [evenement("CP", 10)]);
    assert.equal(pointe.evenement, null);
    assert.equal(pointe.nonValides.length, 1);
    assert.equal(resumerJour({ jour: JOUR, horaire: null, pointages: [] }, []).profilCode, null);
  });

  it("distingue un jour sans aucune affectation d'un repos", () => {
    assert.equal(resumerJour({ jour: JOUR, horaire: null, pointages: [], estSansPlanning: true }, []).estSansPlanning, true);
    assert.equal(resumerJour({ jour: JOUR, horaire: null, pointages: [] }, []).estSansPlanning, false);
  });

  // Bug : un samedi matin non badgé pendant un congé de paternité donnait « 08:00 à 12:00, 4 h » et « Absence justifiée ».
  it("ne présume pas la présence d'un profil non badgé un jour d'absence retenue", () => {
    const nonBadge = { ...HORAIRE, debutPrevu: 480, finPrevue: 720, dureePrevue: 240, estBadge: false };
    const absent = resumerJour({ jour: JOUR, horaire: nonBadge, pointages: [] }, [evenement("PAT", 40)]);
    assert.deepEqual([absent.entree, absent.sortie, absent.travailleMinutes, absent.retardMinutes], [null, null, null, null]);
    const present = resumerJour({ jour: JOUR, horaire: nonBadge, pointages: [] }, []);
    assert.deepEqual([present.entree, present.sortie, present.travailleMinutes], [480, 720, 240]);
  });
});
