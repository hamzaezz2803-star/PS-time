-- Annule la migration 0019_horaire_dynamique (à exécuter à la main, dans phpMyAdmin par exemple).
-- Attention : les règles horaires et le choix « horaire dynamique » des employés sont perdus.
DROP TABLE IF EXISTS `regles_horaires`;
ALTER TABLE `employes` DROP COLUMN `horaire_dynamique`;
-- Oublie la migration, pour que « npm run db:migrer » puisse la rejouer.
DELETE FROM `__drizzle_migrations` WHERE `created_at` = 1794913540949;
