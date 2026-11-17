/** Textes de la cloche de notifications : phrase de chaque action, libellés et états. */
import type { Notification } from "@/types";

/** Nom de chaque élément, avec son article (« le site », « l'employé »...). */
const OBJETS: Record<Notification["objet"], { avec: string; sans: string }> = {
  site: { avec: "le site", sans: "un site" },
  departement: { avec: "le département", sans: "un département" },
  poste: { avec: "le poste", sans: "un poste" },
  employe: { avec: "l'employé", sans: "un employé" },
  profil_horaire: { avec: "le profil horaire", sans: "un profil horaire" },
  rotation: { avec: "la rotation", sans: "une rotation" },
  groupe: { avec: "le groupe", sans: "un groupe" },
  affectation: { avec: "l'affectation", sans: "une affectation" },
  regle_horaire: { avec: "la règle horaire", sans: "une règle horaire" },
  horaire_dynamique: { avec: "les employés en horaire dynamique", sans: "les employés en horaire dynamique" },
  pointage: { avec: "le pointage", sans: "un pointage" },
  utilisateur: { avec: "le compte", sans: "un compte" },
  mot_de_passe: { avec: "son mot de passe", sans: "son mot de passe" },
};

const VERBES: Record<Notification["action"], string> = {
  creation: "a créé",
  modification: "a modifié",
  suppression: "a supprimé",
};

export const TEXTES_NOTIFICATIONS = {
  ouvrir: "Notifications",
  ouvrirNonLues: (nombre: number) => `Notifications, ${nombre} non lue${nombre > 1 ? "s" : ""}`,
  titre: "Notifications",
  nonLues: (nombre: number) => (nombre === 0 ? "Tout est lu" : nombre === 1 ? "1 nouvelle" : `${nombre} nouvelles`),
  vide: "Aucune notification pour le moment.",
  aide: "Chaque création, modification ou suppression dans vos modules apparaîtra ici.",
  vous: "Vous",
  nouveau: "Nouveau",
  erreur: "Impossible de charger les notifications. Nouvel essai dans quelques secondes.",
  aideConservation: (jours: number) => `Les ${jours} derniers jours, selon vos modules.`,
  /** « Salma a créé le site « Usine » » ; pour un pointage, le libellé dit l'état et le nombre. */
  phrase: (notification: Pick<Notification, "action" | "objet" | "libelle">, auteur: string) => {
    if (notification.objet === "mot_de_passe") return `${auteur} a changé son mot de passe`;
    if (notification.objet === "pointage" && notification.action === "creation") {
      return `${auteur} a saisi des pointages${notification.libelle ? ` : ${notification.libelle}` : ""}`;
    }
    const objet = OBJETS[notification.objet];
    return notification.libelle
      ? `${auteur} ${VERBES[notification.action]} ${objet.avec} « ${notification.libelle} »`
      : `${auteur} ${VERBES[notification.action]} ${objet.sans}`;
  },
  /** Libellé d'une saisie de pointages : « Entrée · 3 employés ». */
  libellePointages: (etat: string, nombre: number) => `${etat} · ${nombre} employé${nombre > 1 ? "s" : ""}`,
};
