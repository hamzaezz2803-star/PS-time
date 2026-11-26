/**
 * Génère le script SQL de création d'un utilisateur, à exécuter dans DBeaver (éditeur SQL)
 * ou avec psql. Ne se connecte pas à la base.
 *
 *   npm run --silent sql:utilisateur -- --identifiant admin --email admin@client.ma --nom "Nom Prénom" --super-admin
 *
 * Le mot de passe est temporaire : l'utilisateur devra le changer à la première connexion.
 * Le SQL contient seulement son empreinte scrypt, jamais le mot de passe en clair.
 */
import { escapeLiteral as escape } from "pg";
import {
  FOURNISSEUR_MOT_DE_PASSE,
  lireArgumentsUtilisateur,
  preparerNouvelUtilisateur,
} from "./outils-utilisateur.mts";

const USAGE =
  'npm run --silent sql:utilisateur -- --identifiant admin --email admin@client.ma --nom "Nom Prénom" [--super-admin]';

const { identifiant, email, nom, estSuperAdmin } = lireArgumentsUtilisateur(USAGE);
const { id, idCompte, motDePasseTemporaire, empreinte } = await preparerNouvelUtilisateur();

// Valeurs échappées par pg (escapeLiteral) : aucune concaténation de texte brut dans le SQL.
const sql = `-- Utilisateur « ${identifiant} » (généré par scripts/generer-sql-utilisateur.mts)
BEGIN;

INSERT INTO utilisateurs (id, identifiant, email, nom, est_super_admin, doit_changer_mot_de_passe)
VALUES (${escape(id)}, ${escape(identifiant)}, ${escape(email)}, ${escape(nom)}, ${estSuperAdmin ? "true" : "false"}, true);

INSERT INTO comptes (id, utilisateur_id, fournisseur_id, compte_id, mot_de_passe)
VALUES (${escape(idCompte)}, ${escape(id)}, ${escape(FOURNISSEUR_MOT_DE_PASSE)}, ${escape(id)}, ${escape(empreinte)});

COMMIT;`;

console.info(sql);
// Sur la sortie d'erreur, pour que `> fichier.sql` n'enregistre que le SQL.
console.error(`\nMot de passe temporaire (affiché une seule fois) : ${motDePasseTemporaire}`);
console.error("À communiquer à l'utilisateur ; il devra le changer à la première connexion.");
