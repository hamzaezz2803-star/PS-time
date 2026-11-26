-- Annule les migrations 0022_retirer_autorisations_modules et 0021_autorisations_pages_et_parametres
-- (à exécuter à la main, dans phpMyAdmin par exemple), puis revenir au code d'avant.
-- Un module est rendu à un administrateur s'il avait au moins une page de ce module.
-- Attention : le détail page par page et toute l'apparence choisie (thème, couleurs, police, taille) sont perdus.
-- Si la migration 0023 a été appliquée, l'oublier aussi (voir __drizzle_migrations, dernière ligne).
CREATE TABLE `autorisations_utilisateurs` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`utilisateur_id` char(36) NOT NULL,
	`module` varchar(20) NOT NULL,
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `autorisations_utilisateurs_id` PRIMARY KEY(`id`),
	CONSTRAINT `autorisations_utilisateur_module_idx` UNIQUE(`utilisateur_id`,`module`),
	CONSTRAINT `autorisations_module_valide` CHECK(`autorisations_utilisateurs`.`module` IN ('personnel', 'planning', 'presence'))
);
ALTER TABLE `autorisations_utilisateurs` ADD CONSTRAINT `autorisations_utilisateurs_utilisateur_id_utilisateurs_id_fk` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE cascade ON UPDATE no action;
INSERT INTO `autorisations_utilisateurs` (`utilisateur_id`, `module`)
SELECT DISTINCT `utilisateur_id`,
	CASE
		WHEN `page` IN ('sites', 'departements', 'postes', 'personnes') THEN 'personnel'
		WHEN `page` IN ('pointages_manuels', 'compteurs', 'detail_jour') THEN 'presence'
		ELSE 'planning'
	END
FROM `autorisations_pages`;
DROP TABLE IF EXISTS `autorisations_pages`;
DROP TABLE IF EXISTS `parametres`;
-- Oublie les deux migrations, pour que « npm run db:migrer » puisse les rejouer.
DELETE FROM `__drizzle_migrations` WHERE `created_at` IN (1795008059334, 1795008074938);
