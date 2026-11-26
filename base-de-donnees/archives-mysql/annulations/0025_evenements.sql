-- Annule la migration 0025_evenements (à exécuter à la main, dans phpMyAdmin par exemple).
-- Attention : les événements et leurs périodes de prise sont perdus, et la page « Événements »
-- est retirée des droits des administrateurs.
DELETE FROM `autorisations_pages` WHERE `page` = 'evenements';
ALTER TABLE `autorisations_pages` DROP CONSTRAINT `autorisations_pages_page_valide`;
ALTER TABLE `autorisations_pages` ADD CONSTRAINT `autorisations_pages_page_valide` CHECK (`autorisations_pages`.`page` IN ('sites', 'departements', 'postes', 'personnes', 'profils_horaires', 'rotations', 'groupes', 'affectations', 'horaire_dynamique', 'rapport_presences', 'pointages_manuels', 'compteurs', 'detail_jour'));
DROP TABLE IF EXISTS `periodes_evenements`;
DROP TABLE IF EXISTS `evenements`;
-- Oublie la migration, pour que « npm run db:migrer » puisse la rejouer.
DELETE FROM `__drizzle_migrations` WHERE `created_at` = 1795087896868;
