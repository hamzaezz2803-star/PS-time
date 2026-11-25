# Passage de MySQL à PostgreSQL

Demande du responsable (25/11/2026) : base PostgreSQL au lieu de MySQL, sur un serveur séparé de l'application.

État : **la base est convertie, l'application pas encore**. Tant que le code (Drizzle `mysql-core`, pilote `mysql2`, sauvegarde) n'est pas migré, l'application continue d'utiliser MySQL.

## 1. Convertir l'export phpMyAdmin

```powershell
npm run db:convertir-postgres -- --source C:\chemin\ps-time.sql
```

- Produit `sauvegardes/ps-time-postgres.sql` (dossier hors de Git, fichier jamais écrasé).
- Lit l'export comme du texte, ne se connecte à aucune base.
- Reprend tables, données, index, clés étrangères, et les 76 contraintes CHECK (phpMyAdmin ne les exporte pas : elles viennent de `scripts/contraintes-postgres.mts`, copie fidèle de `src/lib/donnees/schema.ts`).
- Ne reprend pas `sessions`, `verifications` (chacun se reconnecte) ni `__drizzle_migrations`.
- Types : `char(36)` → `uuid`, `tinyint(1)` → `boolean`, `datetime(3)` → `timestamptz(3)` (UTC), `mediumblob` → `bytea`, `decimal` → `numeric`. `ON UPDATE CURRENT_TIMESTAMP` → déclencheur `maj_modifie_le`.
- Une seule transaction : en cas d'erreur, rien n'est gardé.

## 2. Créer la base et les comptes (DBeaver)

Fichier : `base-de-donnees/postgres/00-roles-et-base.sql`.

1. Connexion `postgres` (superutilisateur) > clic droit > **Éditeur SQL > Nouveau script**.
2. Coller la **partie A**, remplacer les deux mots de passe (longs, aléatoires, gardés dans un gestionnaire de mots de passe), exécuter avec **Alt+X**. Ne pas enregistrer le script avec les mots de passe.
3. Rafraîchir (F5) : la base `ps_time` apparaît. Ouvrir un éditeur SQL sur **`ps_time`** (toujours en `postgres`), coller la **partie B** sans les `--`, Alt+X.
4. Créer une nouvelle connexion DBeaver : **Base de données > Nouvelle connexion > PostgreSQL**, hôte du serveur de base, port 5432, base `ps_time`, utilisateur `ps_time_proprietaire`. Onglet **SSL** : activer si le serveur est distant.

## 3. Charger les données (DBeaver)

1. Sur la connexion `ps_time_proprietaire` : **Éditeur SQL > Charger un script** (ou glisser `ps-time-postgres.sql`), puis **Exécuter le script (Alt+X)**.
   - Si DBeaver signale une erreur : choisir **Arrêter**, puis exécuter `ROLLBACK;`. Rien n'a été gardé.
   - Variante plus sûre pour un gros fichier : clic droit sur la base > **Outils > Exécuter un script** (utilise `psql`, à indiquer dans « Client local »).
2. Vérifier : F5 sur `ps_time > Schémas > public > Tables` (29 tables), puis par exemple `SELECT count(*) FROM pointages;`.

Tables créées par `ps_time_proprietaire` : grâce aux droits par défaut, `ps_time_app` peut lire et écrire les lignes, mais ni créer, ni modifier, ni supprimer une table (vérifié).

## 4. Séparer l'application et la base

| Serveur | Contient | Accès |
| --- | --- | --- |
| Base de données | PostgreSQL seul, sauvegardes `pg_dump` quotidiennes | Port 5432 fermé à Internet, ouvert **seulement** à l'IP du serveur d'application (pare-feu + `pg_hba.conf`) |
| Application | Version compilée de Next.js (`npm run build`), sans le dossier `src/` ni `.git` | HTTPS seulement (proxy inverse), compte système sans droits d'administration |

- `pg_hba.conf` du serveur de base : `hostssl ps_time ps_time_app <IP_serveur_app>/32 scram-sha-256` ; `listen_addresses` sur l'IP privée.
- `.env` du serveur d'application : `DATABASE_URL=postgres://ps_time_app:<mot de passe>@<IP_base>:5432/ps_time?sslmode=require`. Le compte `ps_time_proprietaire` ne sert qu'aux migrations, jamais à l'application.
- Administration de la base depuis DBeaver : onglet **SSH** de la connexion (tunnel vers le serveur de base), jamais en ouvrant 5432 à Internet.
- Code source : le navigateur ne reçoit que du JavaScript compilé (pas de cartes de source en production). Sur le serveur, déployer seulement le résultat du build (`output: "standalone"` dans `next.config.ts`, à ajouter lors de la migration du code).

## 5. Reste à faire (code)

- `schema.ts` en `drizzle-orm/pg-core`, `drizzle.config.ts` en `dialect: "postgresql"`, migrations PostgreSQL de départ alignées sur cette base.
- Pilote PostgreSQL à la place de `mysql2` (nouvelle bibliothèque à valider et à inscrire dans `README-projet.md`).
- Réécrire la sauvegarde (export `.sql`, import) et le code propre à MySQL (`pointages.ts`, `apparence.ts`, scripts).
- Comparaisons sans tenir compte des majuscules : MySQL (`*_ci`) les faisait seul ; en PostgreSQL, recherches en `ILIKE` et unicité des noms à revoir (`lower(...)`).
