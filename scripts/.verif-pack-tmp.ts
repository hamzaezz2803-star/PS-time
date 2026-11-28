// Vérification ponctuelle (fichier temporaire, supprimé après usage) : valeurs des compteurs du pack.
import { aujourdhuiLocal, chargerJoursService } from "@/lib/donnees/compteurs-calcul";
import { listerCompteursActifs } from "@/lib/donnees/compteurs";
import { calculerCompteurs } from "@/lib/metier/compteurs/calcul";
import { formaterValeur } from "@/lib/metier/compteurs/format";
import { ajouterJours, periodesDeLaDate, semaineDe } from "@/lib/metier/compteurs/periodes";

const aujourdhui = aujourdhuiLocal();
// Dimanche de la semaine dernière : la semaine est complète.
const date = ajouterJours(semaineDe(aujourdhui).debut, -1);
const periodes = periodesDeLaDate(date, aujourdhui);
const debut = periodes.map((p) => p.debut).sort()[0];
const compteurs = (await listerCompteursActifs()).filter((c) => c.pack);

for (const [nom, id] of [["Karim Benali (Bureau)", "00000000-0000-4000-8000-000000000301"], ["Adil Naciri (J8, 6 j/sem.)", "00000000-0000-4000-8000-000000000316"]]) {
  const jours = await chargerJoursService(id, debut, date);
  if (!jours.ok) throw new Error(jours.erreur);
  const valeurs = calculerCompteurs(compteurs, periodes, jours.jours);
  console.log(`\n== ${nom}, au ${date}`);
  for (const c of compteurs) {
    const ligne = valeurs
      .filter((v) => v.idCompteur === c.id)
      .map((v) => `${v.periodicite}: ${v.ok ? formaterValeur(v.valeur, c.unite) : `(${v.erreur.code})`}`)
      .join("  ");
    console.log(`${String(c.pack?.numero).padStart(2, "0")} ${c.nom.padEnd(26)} ${ligne}`);
  }
}
process.exit(0);
