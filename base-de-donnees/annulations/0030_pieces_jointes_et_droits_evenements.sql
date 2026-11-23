-- Annule la migration 0030_pieces_jointes_et_droits_evenements (à exécuter à la main, dans
-- phpMyAdmin par exemple). Attention : les pièces justificatives des droits aux congés sont
-- perdues, ainsi que la case « soumis à la gestion des droits » des événements.
DROP TABLE IF EXISTS `droits_conges_pieces_jointes`;
DROP TABLE IF EXISTS `pieces_jointes`;
ALTER TABLE `evenements` DROP COLUMN `est_soumis_droits`;
-- Oublie la migration, pour que « npm run db:migrer » puisse la rejouer.
DELETE FROM `__drizzle_migrations` WHERE `created_at` = 1795451797832;
