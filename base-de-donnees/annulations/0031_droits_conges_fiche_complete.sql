-- Annule la migration 0031_droits_conges_fiche_complete (à exécuter à la main, dans phpMyAdmin
-- par exemple). Attention : l'unité, les suppléments, la confirmation et le report des droits aux
-- congés sont perdus (les droits en heures redeviennent des jours avec les mêmes chiffres).
ALTER TABLE `droits_conges` DROP CONSTRAINT `droits_conges_supplement_1_valide`;
ALTER TABLE `droits_conges` DROP CONSTRAINT `droits_conges_supplement_2_valide`;
ALTER TABLE `droits_conges` DROP CONSTRAINT `droits_conges_supplement_3_valide`;
ALTER TABLE `droits_conges` DROP CONSTRAINT `droits_conges_unite_valide`;
ALTER TABLE `droits_conges` DROP COLUMN `supplement_1`, DROP COLUMN `supplement_2`, DROP COLUMN `supplement_3`, DROP COLUMN `unite_saisie`, DROP COLUMN `est_confirme`, DROP COLUMN `est_reporte`;
-- Oublie la migration, pour que « npm run db:migrer » puisse la rejouer.
DELETE FROM `__drizzle_migrations` WHERE `created_at` = 1795453024013;
