CREATE TABLE `autorisations_pages` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`utilisateur_id` char(36) NOT NULL,
	`page` varchar(30) NOT NULL,
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `autorisations_pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `autorisations_pages_utilisateur_page_idx` UNIQUE(`utilisateur_id`,`page`),
	CONSTRAINT `autorisations_pages_page_valide` CHECK(`autorisations_pages`.`page` IN ('sites', 'departements', 'postes', 'personnes', 'profils_horaires', 'rotations', 'groupes', 'affectations', 'horaire_dynamique', 'rapport_presences', 'pointages_manuels', 'compteurs', 'detail_jour'))
);
--> statement-breakpoint
CREATE TABLE `parametres` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`cle` varchar(30) NOT NULL,
	`valeur` varchar(50) NOT NULL,
	`modifie_par` char(36),
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `parametres_id` PRIMARY KEY(`id`),
	CONSTRAINT `parametres_cle_idx` UNIQUE(`cle`),
	CONSTRAINT `parametres_valeur_valide` CHECK((`parametres`.`cle` = 'theme' AND `parametres`.`valeur` IN ('bleu', 'emeraude', 'ocean', 'ardoise')) OR (`parametres`.`cle` = 'police' AND `parametres`.`valeur` IN ('hanken', 'inter', 'source_sans', 'atkinson')))
);
--> statement-breakpoint
ALTER TABLE `autorisations_pages` ADD CONSTRAINT `autorisations_pages_utilisateur_id_utilisateurs_id_fk` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parametres` ADD CONSTRAINT `parametres_modifie_par_utilisateurs_id_fk` FOREIGN KEY (`modifie_par`) REFERENCES `utilisateurs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `parametres_modifie_par_idx` ON `parametres` (`modifie_par`);--> statement-breakpoint
-- Reprise des droits : chaque module accordé devient l'ensemble de ses pages.
INSERT INTO `autorisations_pages` (`utilisateur_id`, `page`)
SELECT `a`.`utilisateur_id`, `p`.`page`
FROM `autorisations_utilisateurs` `a`
JOIN (
	SELECT 'personnel' AS `module`, 'sites' AS `page` UNION ALL
	SELECT 'personnel', 'departements' UNION ALL
	SELECT 'personnel', 'postes' UNION ALL
	SELECT 'personnel', 'personnes' UNION ALL
	SELECT 'planning', 'profils_horaires' UNION ALL
	SELECT 'planning', 'rotations' UNION ALL
	SELECT 'planning', 'groupes' UNION ALL
	SELECT 'planning', 'affectations' UNION ALL
	SELECT 'planning', 'horaire_dynamique' UNION ALL
	SELECT 'planning', 'rapport_presences' UNION ALL
	SELECT 'presence', 'pointages_manuels' UNION ALL
	SELECT 'presence', 'compteurs' UNION ALL
	SELECT 'presence', 'detail_jour'
) `p` ON `p`.`module` = `a`.`module`;
