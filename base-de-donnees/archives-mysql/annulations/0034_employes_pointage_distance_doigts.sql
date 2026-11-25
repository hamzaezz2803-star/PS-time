-- Annulation manuelle de la migration 0034 (pointage à distance et doigts à enrôler des employés).
-- Les autorisations et les doigts choisis sont perdus. DROP CONSTRAINT demande MySQL 8.0.19+ ou MariaDB 10.4+.
ALTER TABLE `employes` DROP CONSTRAINT `employes_appareils_distance_valides`;
ALTER TABLE `employes` DROP CONSTRAINT `employes_doigts_valides`;
ALTER TABLE `employes` DROP CONSTRAINT `employes_distance_coherente`;
ALTER TABLE `employes` DROP COLUMN `pointage_distance`, DROP COLUMN `appareils_distance`, DROP COLUMN `distance_exige_position`, DROP COLUMN `distance_exige_photo`, DROP COLUMN `doigts_a_enroler`;
-- Oublie la migration, pour que « npm run db:migrer » puisse la rejouer.
DELETE FROM `__drizzle_migrations` WHERE `created_at` = 1795540104699;
