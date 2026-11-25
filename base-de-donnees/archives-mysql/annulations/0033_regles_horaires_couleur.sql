-- Annulation manuelle de la migration 0033 (couleur des règles d'horaire dynamique).
-- Les couleurs choisies sont perdues. DROP CONSTRAINT demande MySQL 8.0.19+ ou MariaDB 10.4+.
ALTER TABLE `regles_horaires` DROP CONSTRAINT `regles_horaires_couleur_valide`;
ALTER TABLE `regles_horaires` DROP COLUMN `couleur`;
-- Oublie la migration, pour que « npm run db:migrer » puisse la rejouer.
DELETE FROM `__drizzle_migrations` WHERE `created_at` = 1795539469208;
