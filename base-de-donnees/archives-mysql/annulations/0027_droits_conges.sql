-- Annule la migration 0027_droits_conges (à exécuter à la main, dans phpMyAdmin par exemple).
-- Attention : les droits aux congés saisis sont perdus, et la page « Droits aux congés » est
-- retirée des droits des administrateurs. Les absences, elles, ne changent pas.
DELETE FROM `autorisations_pages` WHERE `page` = 'droits_conges';
ALTER TABLE `autorisations_pages` DROP CONSTRAINT `autorisations_pages_page_valide`;
ALTER TABLE `autorisations_pages` ADD CONSTRAINT `autorisations_pages_page_valide` CHECK (`autorisations_pages`.`page` IN ('sites', 'departements', 'postes', 'personnes', 'profils_horaires', 'rotations', 'groupes', 'affectations', 'horaire_dynamique', 'rapport_presences', 'pointages_manuels', 'evenements', 'absences', 'compteurs', 'detail_jour'));
DROP TABLE IF EXISTS `droits_conges`;
-- Oublie la migration, pour que « npm run db:migrer » puisse la rejouer.
DELETE FROM `__drizzle_migrations` WHERE `created_at` = 1795267094926;
