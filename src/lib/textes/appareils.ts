/** Textes de la partie Appareils (badgeuses). */
import type { EtatHeure, StatutBadgeuse } from "@/lib/metier/badgeuses/etat";

const pluriel = (nombre: number, mot: string) => `${nombre.toLocaleString("fr-FR")} ${mot}${nombre > 1 ? "s" : ""}`;

/** « 2026-11-27 08:05:42 » devient « 27/11/2026 à 08:05:42 ». */
const heureLisible = (texte: string) => {
  const [jour, heure] = texte.split(" ");
  const [annee, mois, j] = jour.split("-");
  return `${j}/${mois}/${annee} à ${heure}`;
};

function dureeEcart(secondes: number): string {
  const valeur = Math.abs(secondes);
  if (valeur < 60) return pluriel(valeur, "seconde");
  if (valeur < 3600) return pluriel(Math.round(valeur / 60), "minute");
  if (valeur < 86_400) return pluriel(Math.round(valeur / 3600), "heure");
  return pluriel(Math.round(valeur / 86_400), "jour");
}

export const TEXTES_APPAREILS = {
  titrePage: "Badgeuses",
  chargement: "Chargement des badgeuses...",
  droits: "Cette page est réservée au super administrateur.",

  reseau: {
    titre: "Réseau du serveur",
    aucun: "Le serveur n'est relié à aucun réseau privé (10.x, 172.16 à 31.x, 192.168.x) : la recherche automatique est impossible.",
    serveur: "Serveur",
    plage: (reseau: string, longueur: number) => `${reseau}/${longueur}`,
    reduit: "Grand réseau : seules les 254 adresses voisines du serveur sont parcourues.",
  },

  recherche: {
    bouton: "Rechercher les badgeuses",
    relancer: "Relancer la recherche",
    enCours: "Recherche sur le réseau...",
    enCoursDetail: "Chaque adresse du réseau est essayée. Cela prend quelques secondes.",
    resultat: (nombre: number) => (nombre === 0 ? "Aucune badgeuse trouvée." : `${pluriel(nombre, "badgeuse")} trouvée${nombre > 1 ? "s" : ""}.`),
    tropRapide: "Trop de recherches à la suite. Patientez une minute.",
    echec: "La recherche a échoué. Réessayez dans un instant.",
    derniere: (heure: string) => `Dernière recherche à ${heure}`,
  },

  ajout: {
    titre: "Badgeuse sur un autre réseau ?",
    libelle: "Adresse IP de la badgeuse",
    exemple: "ex. 192.168.1.201",
    bouton: "Tester l'adresse",
    invalide: "Saisissez une adresse IP privée valable, par exemple 192.168.1.201.",
  },

  vide: {
    avant: "Lancez une recherche pour voir les badgeuses",
    avantDetail: "Branchez la badgeuse sur le même réseau que le serveur, allumez-la, puis lancez la recherche.",
    apres: "Aucune badgeuse n'a répondu",
    conseils: [
      "La badgeuse est allumée et reliée par câble ou Wi-Fi au même réseau que le serveur.",
      "Dans son menu Communication, l'adresse IP est du même réseau et le port est 4370.",
      "Le pare-feu du serveur laisse sortir les connexions vers le port 4370.",
    ],
  },

  liste: {
    titre: "Badgeuses détectées",
    sansNom: "Badgeuse ZKTeco",
    adresse: "Adresse IP",
    numeroSerie: "N° de série",
    version: "Version",
    heure: "Heure de l'appareil",
    utilisateurs: "Utilisateurs enregistrés",
    pointages: "Pointages en mémoire",
    nonLu: "Non lu",
    verifieLe: (heure: string) => `Vérifiée à ${heure}`,
    nombre: (valeur: number) => valeur.toLocaleString("fr-FR"),
  },

  statuts: {
    en_ligne: "En ligne",
    protegee: "Mot de passe exigé",
    injoignable: "Injoignable",
    non_reconnue: "Non reconnue",
  } satisfies Record<StatutBadgeuse, string>,

  explicationsStatut: {
    en_ligne: "",
    protegee:
      "La badgeuse exige un mot de passe de communication. Remettez-le à 0 dans son menu Communication, puis vérifiez à nouveau.",
    injoignable: "La badgeuse ne répond plus. Vérifiez qu'elle est allumée et reliée au réseau.",
    non_reconnue: "Un appareil répond à cette adresse, mais pas comme une badgeuse ZKTeco.",
  } satisfies Record<StatutBadgeuse, string>,

  heures: {
    a_l_heure: "À l'heure",
    a_regler: "Heure à régler",
    inconnue: "Heure inconnue",
  } satisfies Record<EtatHeure, string>,
  heureLisible,
  ecart: (secondes: number) => (secondes === 0 ? "même heure que le serveur" : `${secondes > 0 ? "avance" : "retard"} de ${dureeEcart(secondes)}`),

  actions: {
    verifier: "Vérifier",
    verification: "Vérification...",
    synchroniser: "Synchroniser",
    synchronisation: "Synchronisation...",
  },

  messages: {
    verifiee: "Badgeuse vérifiée : elle répond.",
    synchronisee: (heure: string) => `Synchronisée : heure réglée sur ${heure}, badgeuse prête pour le pointage.`,
    heureRefusee: "La badgeuse répond, mais a refusé le réglage de l'heure. Réglez-la depuis son menu.",
    echecSynchro: "Synchronisation impossible : la badgeuse ne répond pas.",
    tropRapide: "Trop d'essais à la suite. Patientez une minute.",
    echec: "L'opération a échoué. Réessayez dans un instant.",
  },

  exemple: {
    voir: "Voir un exemple",
    masquer: "Masquer l'exemple",
    pastille: "Exemple",
    titre: "Exemple de badgeuse détectée",
    avertissement:
      "Démonstration : ces valeurs ne viennent pas d'un vrai appareil. Elles montrent ce qu'affiche PS Time quand une badgeuse répond. Les boutons ne contactent rien sur le réseau.",
    verifiee: "Exemple : la badgeuse répond.",
    synchronisee: (heure: string) => `Exemple : heure réglée sur ${heure}, badgeuse prête pour le pointage.`,
  },


  historique: (adresse: string, numeroSerie: string | null) => `${adresse}${numeroSerie ? ` · n° ${numeroSerie}` : ""} · heure réglée`,
};
