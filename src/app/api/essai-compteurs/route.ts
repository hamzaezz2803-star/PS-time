// TEMPORAIRE : vérification de l'étape 3, supprimé juste après.
import { peutGererModule } from "@/lib/actions/droits";
import { calculerCompteursEmploye, chargerJoursService } from "@/lib/donnees/compteurs-calcul";

export async function GET(requete: Request) {
  if (!(await peutGererModule("presence"))) return Response.json({ refus: true }, { status: 403 });
  const parametres = new URL(requete.url).searchParams;
  const employe = parametres.get("employe") ?? "";
  const date = parametres.get("date") ?? "";
  const jours = await chargerJoursService(employe, date, date);
  const compteurs = await calculerCompteursEmploye(employe, date, [
    { id: "RETARD", version: 1, formule: "RETARD_MIN", periodicites: ["JOUR", "SEMAINE", "MOIS"] },
    { id: "PRESENCES", version: 1, formule: "NB_JOURS_TRAVAILLES", periodicites: ["SEMAINE", "MOIS"] },
  ]);
  return Response.json({ jours, compteurs });
}
