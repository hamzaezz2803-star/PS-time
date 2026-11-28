/** Textes de la page Administration > Sauvegarde (réservée au super administrateur). */
import { MOT_CONFIRMATION_IMPORT, TAILLE_MAX_IMPORT_OCTETS } from "@/lib/constantes";
import type { ErreurImport } from "@/lib/donnees/sauvegarde-import";

const TAILLE_MAX_MO = Math.round(TAILLE_MAX_IMPORT_OCTETS / (1024 * 1024));

export const TEXTES_SAUVEGARDE = {
  titrePage: "Sauvegarde",
  chargement: "Chargement de la sauvegarde...",
  droits: "La sauvegarde est réservée au super administrateur.",
  confidentiel:
    "Le fichier contient des données personnelles (pièces d'identité, photos, téléphones) et, si vous le choisissez, les comptes et les empreintes de leurs mots de passe. Gardez-le dans un endroit sûr et ne l'envoyez jamais par e-mail ou messagerie.",
  export: {
    titre: "Exporter les données",
    description: "Un fichier .sql avec toutes les données : personnel, planning, pointages, événements, compteurs, historique et réglages.",
    comptes: "Inclure les comptes de connexion",
    aideComptes:
      "Utilisateurs, empreintes des mots de passe et pages accordées. Nécessaire pour une restauration complète. Les sessions ouvertes ne sont jamais exportées.",
    bouton: "Télécharger la sauvegarde",
    echec: "Impossible de préparer la sauvegarde. Réessayez dans un instant.",
  },
  import: {
    titre: "Importer une sauvegarde",
    description:
      "Remplace toutes les données actuelles par celles du fichier. Seuls les fichiers exportés par PS Time sur cette installation (même clé secrète) et à la même version de la base sont acceptés.",
    avantImport: "Une sauvegarde complète de la base actuelle est d'abord enregistrée sur le serveur, dans le dossier « sauvegardes ».",
    externe: "Pour un fichier SQL d'une autre origine (pg_dump, DBeaver, ancien serveur), passez par la commande npm run sauvegarde:importer sur le serveur.",
    fichier: "Fichier de sauvegarde (.sql)",
    aideFichier: `${TAILLE_MAX_MO} Mo au plus.`,
    confirmation: `Pour confirmer, tapez ${MOT_CONFIRMATION_IMPORT}`,
    aideConfirmation: "Les données actuelles seront remplacées. Si le fichier contient les comptes, tout le monde devra se reconnecter.",
    bouton: "Importer et remplacer les données",
    enCours: "Import en cours, ne fermez pas la page...",
    reconnecter: "Se reconnecter",
  },
  erreursSaisie: {
    fichier: "Choisissez un fichier de sauvegarde .sql.",
    taille: `Le fichier dépasse ${TAILLE_MAX_MO} Mo.`,
    confirmation: `Tapez exactement ${MOT_CONFIRMATION_IMPORT} pour confirmer.`,
  },
  erreurs: {
    signature: "Ce fichier n'a pas été exporté par PS Time sur cette installation, ou il a été modifié depuis. Rien n'a été changé.",
    format: "Ce fichier n'est pas une sauvegarde PS Time reconnue. Rien n'a été changé.",
    migration: "Cette sauvegarde vient d'une autre version de PS Time (base différente). Mettez d'abord les deux installations à la même version. Rien n'a été changé.",
    tables: "Cette sauvegarde ne contient pas les tables attendues. Rien n'a été changé.",
    contenu: "Ce fichier contient des instructions non autorisées. Rien n'a été changé.",
    sauvegarde_avant: "La sauvegarde automatique de la base actuelle a échoué : l'import est annulé. Rien n'a été changé.",
    incoherent: "Les données du fichier sont incohérentes (liens vers des éléments absents). L'import a été annulé, rien n'a été changé.",
    sans_super_admin: "Le fichier ne contient aucun super administrateur actif : l'import a été annulé pour ne pas bloquer l'accès. Rien n'a été changé.",
  } satisfies Record<ErreurImport, string>,
  echecImport: "L'import a échoué et a été annulé. Rien n'a été changé. Réessayez dans un instant.",
  importReussi: (tables: number, lignes: number, sauvegardeAvant: string) =>
    `Import terminé : ${lignes} ligne${lignes > 1 ? "s" : ""} dans ${tables} tables. Ancienne base enregistrée sur le serveur : ${sauvegardeAvant}.`,
  reconnexion: "Les comptes ont été remplacés : toutes les sessions sont fermées.",
  libelleExport: (avecComptes: boolean) => `fichier SQL, ${avecComptes ? "avec" : "sans"} les comptes`,
  libelleImport: (nomFichier: string, avecComptes: boolean) => `${nomFichier}, ${avecComptes ? "avec" : "sans"} les comptes`,
} as const;
