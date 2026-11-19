CREATE TABLE `evenements_employes` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`employe_id` char(36) NOT NULL,
	`evenement_id` char(36) NOT NULL,
	`date_debut` date NOT NULL,
	`date_fin` date NOT NULL,
	`debut_minutes` int,
	`fin_minutes` int,
	`remarque` varchar(255),
	`saisi_par` char(36),
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `evenements_employes_id` PRIMARY KEY(`id`),
	CONSTRAINT `evenements_employes_dates_coherentes` CHECK(`evenements_employes`.`date_fin` >= `evenements_employes`.`date_debut`),
	CONSTRAINT `evenements_employes_heures_valides` CHECK((`evenements_employes`.`debut_minutes` IS NULL AND `evenements_employes`.`fin_minutes` IS NULL) OR (`evenements_employes`.`date_debut` = `evenements_employes`.`date_fin` AND `evenements_employes`.`debut_minutes` >= 0 AND `evenements_employes`.`fin_minutes` <= 1440 AND `evenements_employes`.`debut_minutes` < `evenements_employes`.`fin_minutes`))
);
--> statement-breakpoint
ALTER TABLE `autorisations_pages` DROP CONSTRAINT `autorisations_pages_page_valide`;--> statement-breakpoint
ALTER TABLE `evenements_employes` ADD CONSTRAINT `evenements_employes_employe_id_employes_id_fk` FOREIGN KEY (`employe_id`) REFERENCES `employes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evenements_employes` ADD CONSTRAINT `evenements_employes_evenement_id_evenements_id_fk` FOREIGN KEY (`evenement_id`) REFERENCES `evenements`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evenements_employes` ADD CONSTRAINT `evenements_employes_saisi_par_utilisateurs_id_fk` FOREIGN KEY (`saisi_par`) REFERENCES `utilisateurs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `evenements_employes_employe_idx` ON `evenements_employes` (`employe_id`,`date_debut`);--> statement-breakpoint
CREATE INDEX `evenements_employes_evenement_idx` ON `evenements_employes` (`evenement_id`);--> statement-breakpoint
CREATE INDEX `evenements_employes_dates_idx` ON `evenements_employes` (`date_debut`,`date_fin`);--> statement-breakpoint
CREATE INDEX `evenements_employes_saisi_par_idx` ON `evenements_employes` (`saisi_par`);--> statement-breakpoint
ALTER TABLE `autorisations_pages` ADD CONSTRAINT `autorisations_pages_page_valide` CHECK (`autorisations_pages`.`page` IN ('sites', 'departements', 'postes', 'personnes', 'profils_horaires', 'rotations', 'groupes', 'affectations', 'horaire_dynamique', 'rapport_presences', 'pointages_manuels', 'evenements', 'absences', 'compteurs', 'detail_jour'));