-- ps-time : rôles et base PostgreSQL (moindre privilège). Guide : docs/migration-postgresql.md.
--
-- Deux comptes, jamais le superutilisateur « postgres » pour l'application :
--   ps_time_proprietaire : possède les tables, sert aux migrations et à l'import (jamais à l'application) ;
--   ps_time_app          : utilisé par l'application, lit et écrit les lignes, ne peut pas changer le schéma.
--
-- Les mots de passe ne s'écrivent pas dans ce fichier : remplacer les deux valeurs dans l'éditeur
-- de DBeaver au moment de l'exécution, sans enregistrer (mots de passe longs et aléatoires,
-- conservés dans un gestionnaire de mots de passe).

-- ===== Partie A : connecté en « postgres », sur la base « postgres » =====
CREATE ROLE ps_time_proprietaire LOGIN PASSWORD 'REMPLACER_MOT_DE_PASSE_PROPRIETAIRE';
CREATE ROLE ps_time_app LOGIN PASSWORD 'REMPLACER_MOT_DE_PASSE_APPLICATION';
CREATE DATABASE ps_time OWNER ps_time_proprietaire ENCODING 'UTF8' TEMPLATE template0;
REVOKE ALL ON DATABASE ps_time FROM PUBLIC;
GRANT CONNECT ON DATABASE ps_time TO ps_time_app;

-- ===== Partie B : toujours en « postgres », mais connecté à la base « ps_time » =====
-- (à exécuter séparément, après avoir changé de base dans DBeaver)
-- REVOKE ALL ON SCHEMA public FROM PUBLIC;
-- ALTER SCHEMA public OWNER TO ps_time_proprietaire;
-- GRANT USAGE ON SCHEMA public TO ps_time_app;
-- -- Chaque table créée plus tard par le propriétaire est lisible et modifiable par l'application :
-- ALTER DEFAULT PRIVILEGES FOR ROLE ps_time_proprietaire IN SCHEMA public
--   GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ps_time_app;
-- ALTER DEFAULT PRIVILEGES FOR ROLE ps_time_proprietaire IN SCHEMA public
--   GRANT USAGE, SELECT ON SEQUENCES TO ps_time_app;

-- ===== Partie C : connecté en « ps_time_proprietaire » sur « ps_time », APRÈS npm run db:migrer =====
-- (ou après le chargement d'une base convertie). L'application lit la version de la base
-- (page Sauvegarde) dans le suivi des migrations de Drizzle, en lecture seule.
-- GRANT USAGE ON SCHEMA drizzle TO ps_time_app;
-- GRANT SELECT ON drizzle.__drizzle_migrations TO ps_time_app;
