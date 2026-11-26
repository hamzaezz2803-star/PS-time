# Passage de MySQL à PostgreSQL

Demande du responsable (25/11/2026) : base PostgreSQL au lieu de MySQL, sur un serveur séparé de l'application.

État : **fait**. L'application (Drizzle `pg-core`, pilote `pg`, Better Auth, sauvegarde, scripts, données de test) utilise PostgreSQL. Les migrations MySQL sont archivées dans `base-de-donnees/archives-mysql/` (historique seulement).

## Migrations PostgreSQL

| Migration | Contenu |
| --- | --- |
| `0000_initiale` | Toutes les tables, contraintes CHECK, index, clés étrangères, déclencheur `maj_modifie_le` (remplace `ON UPDATE CURRENT_TIMESTAMP`) |
| `0001_noms_sans_casse` | Noms, libellés, codes de poste, matricules et badges uniques sans tenir compte des majuscules (index sur `lower()`), comme le faisait MySQL |
| `0002_cles_differables` | `RESTRICT` devient `NO ACTION` (même effet) et toutes les clés étrangères deviennent différables : la restauration d'une sauvegarde les vérifie à la fin de la transaction, sans superutilisateur |

Drizzle ne génère ni les déclencheurs ni les clés différables : pour une nouvelle table ou une clé recréée, les ajouter à la main dans le SQL de la migration.

Différences de comportement à connaître :

- Recherches (`ILIKE`) : sans tenir compte des majuscules, mais les accents comptent (« Benali » ≠ « Bénali »).
- Valeurs : `uuid`, `boolean`, `timestamptz` (UTC), `bytea`, `numeric`. Session de l'application en UTC.
- Sauvegarde au format 2 (PostgreSQL) : un fichier exporté depuis l'ancienne version MySQL est refusé.

## 1. Créer la base et les comptes (DBeaver)

Fichier : `base-de-donnees/postgres/00-roles-et-base.sql`.

1. Connexion `postgres` (superutilisateur) : **Éditeur SQL > Nouveau script**, coller la **partie A**, remplacer les deux mots de passe (longs, aléatoires, gardés dans un gestionnaire de mots de passe), **Alt+X**. Ne pas enregistrer le script avec les mots de passe.
2. F5 : la base `ps_time` apparaît. Éditeur SQL **sur `ps_time`** (toujours en `postgres`) : **partie B** sans les `--`, Alt+X.
3. Nouvelle connexion DBeaver : PostgreSQL, base `ps_time`, utilisateur `ps_time_proprietaire`.

Contrôle : `SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname = 'ps_time';` doit donner `ps_time_proprietaire`.

## 2. Remplir la base

`.env.local` (voir `.env.example`) :

```
DATABASE_URL=postgres://ps_time_app:<mot de passe>@localhost:5432/ps_time
DATABASE_URL_MIGRATIONS=postgres://ps_time_proprietaire:<mot de passe>@localhost:5432/ps_time
BETTER_AUTH_SECRET=<32 octets aléatoires>
BETTER_AUTH_URL=http://localhost:3000
```

- **Nouvelle installation** : `npm run db:migrer`, puis partie C du fichier des rôles, puis premier compte par `pstime` sur `/connexion`.
- **Reprise d'une ancienne base MySQL** : export phpMyAdmin, puis `npm run db:convertir-postgres -- --source C:\chemin\export.sql` (écrit `sauvegardes/ps-time-postgres.sql`, hors de Git). Dans DBeaver, sur la connexion `ps_time_proprietaire` : ouvrir le fichier, **Alt+X** (une seule transaction ; en cas d'erreur, Arrêter puis `ROLLBACK;`). Puis `npm run db:migrer` (applique 0001 et 0002) et la partie C.
- Données de test (développement) : `base-de-donnees/donnees-test.sql` dans DBeaver, connexion propriétaire, Alt+X.

Contrôle : `SELECT count(*) FROM drizzle.__drizzle_migrations;` donne le nombre de migrations (3 aujourd'hui).

## 3. Séparer l'application et la base

| Serveur | Contient | Accès |
| --- | --- | --- |
| Base de données | PostgreSQL seul, sauvegardes `pg_dump` quotidiennes | Port 5432 fermé à Internet, ouvert **seulement** à l'IP du serveur d'application (pare-feu + `pg_hba.conf`) |
| Application | Version compilée de Next.js (`npm run build`), sans le dossier `src/` ni `.git` | HTTPS seulement (proxy inverse), compte système sans droits d'administration |

- `pg_hba.conf` du serveur de base : `hostssl ps_time ps_time_app <IP_serveur_app>/32 scram-sha-256` (et la même ligne pour `ps_time_proprietaire` si les migrations partent du serveur d'application) ; `listen_addresses` sur l'IP privée.
- `.env` du serveur d'application : `DATABASE_URL=postgres://ps_time_app:...@<IP_base>:5432/ps_time?sslmode=require`. Le compte propriétaire ne sert qu'aux migrations.
- Administration de la base depuis DBeaver : onglet **SSH** de la connexion (tunnel vers le serveur de base), jamais en ouvrant 5432 à Internet.
- Code source : le navigateur ne reçoit que du JavaScript compilé (pas de cartes de source en production). Sur le serveur, ne déployer que le résultat du build. Pour un déploiement sans les sources ni `node_modules` complet, ajouter `output: "standalone"` dans `next.config.ts` et copier `.next/standalone`, `.next/static` et `public` (à valider au moment du premier déploiement).
