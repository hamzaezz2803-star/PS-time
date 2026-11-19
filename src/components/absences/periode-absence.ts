import { formaterJour } from "@/lib/formats";
import { nombreDeJours, type SaisieEvenement } from "@/lib/metier/evenements";
import { minutesVersHeure } from "@/lib/metier/programme";
import { TEXTES_ABSENCES as textes } from "@/lib/textes/absences";

/** Période lisible : « jeu. 3 déc. 2026, journée entière », « du ... au ... (5 jours) » ou « ..., de 10:00 à 12:00 ». */
export function decrirePeriode(saisie: SaisieEvenement): string {
  if (saisie.debutMinutes !== null && saisie.finMinutes !== null) {
    return textes.heures(formaterJour(saisie.debut), minutesVersHeure(saisie.debutMinutes), minutesVersHeure(saisie.finMinutes));
  }
  if (saisie.debut === saisie.fin) return textes.journee(formaterJour(saisie.debut));
  return textes.periode(formaterJour(saisie.debut), formaterJour(saisie.fin), nombreDeJours(saisie));
}
