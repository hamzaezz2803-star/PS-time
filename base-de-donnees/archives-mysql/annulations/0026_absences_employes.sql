-- Annule la migration 0026_absences_employes (à exécuter à la main, dans phpMyAdmin par exemple).
-- Attention : les absences et événements saisis pour les employés sont perdus, et la page
-- « Absences et événements » est retirée des droits des administrateurs.
DELETE FROM `autorisations_pages` WHERE `page` = 'absences';
ALTER TABLE `autorisations_pages` DROP CONSTRAINT `autorisations_pages_page_valide`;
ALTER TABLE `autorisations_pages` ADD CONSTRAINT `autorisations_pages_page_valide` CHECK (`autorisations_pages`.`page` IN ('sites', 'departements', 'postes', 'personnes', 'profils_horaires', 'rotations', 'groupes', 'affectations', 'horaire_dynamique', 'rapport_presences', 'pointages_manuels', 'evenements', 'compteurs', 'detail_jour'));
DROP TABLE IF EXISTS `evenements_employes`;
-- Oublie la migration, pour que « npm run db:migrer » puisse la rejouer.
DELETE FROM `__drizzle_migrations` WHERE `created_at` = 1795089640287;
