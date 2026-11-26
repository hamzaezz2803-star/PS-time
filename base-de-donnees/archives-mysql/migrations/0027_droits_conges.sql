CREATE TABLE `droits_conges` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`employe_id` char(36) NOT NULL,
	`evenement_id` char(36) NOT NULL,
	`date_debut` date NOT NULL,
	`date_fin` date NOT NULL,
	`jours_acquis` decimal(4,1) NOT NULL,
	`jours_reliquat` decimal(4,1) NOT NULL DEFAULT 0,
	`est_bloquant` boolean NOT NULL DEFAULT false,
	`remarque` varchar(255),
	`saisi_par` char(36),
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `droits_conges_id` PRIMARY KEY(`id`),
	CONSTRAINT `droits_conges_dates_coherentes` CHECK(`droits_conges`.`date_fin` >= `droits_conges`.`date_debut`),
	CONSTRAINT `droits_conges_acquis_valide` CHECK(`droits_conges`.`jours_acquis` BETWEEN 0 AND 366 AND `droits_conges`.`jours_acquis` * 2 = FLOOR(`droits_conges`.`jours_acquis` * 2)),
	CONSTRAINT `droits_conges_reliquat_valide` CHECK(`droits_conges`.`jours_reliquat` BETWEEN 0 AND 366 AND `droits_conges`.`jours_reliquat` * 2 = FLOOR(`droits_conges`.`jours_reliquat` * 2))
);
--> statement-breakpoint
ALTER TABLE `autorisations_pages` DROP CONSTRAINT `autorisations_pages_page_valide`;--> statement-breakpoint
ALTER TABLE `droits_conges` ADD CONSTRAINT `droits_conges_employe_id_employes_id_fk` FOREIGN KEY (`employe_id`) REFERENCES `employes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `droits_conges` ADD CONSTRAINT `droits_conges_evenement_id_evenements_id_fk` FOREIGN KEY (`evenement_id`) REFERENCES `evenements`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `droits_conges` ADD CONSTRAINT `droits_conges_saisi_par_utilisateurs_id_fk` FOREIGN KEY (`saisi_par`) REFERENCES `utilisateurs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `droits_conges_employe_idx` ON `droits_conges` (`employe_id`,`evenement_id`,`date_debut`);--> statement-breakpoint
CREATE INDEX `droits_conges_evenement_idx` ON `droits_conges` (`evenement_id`);--> statement-breakpoint
CREATE INDEX `droits_conges_dates_idx` ON `droits_conges` (`date_debut`,`date_fin`);--> statement-breakpoint
CREATE INDEX `droits_conges_saisi_par_idx` ON `droits_conges` (`saisi_par`);--> statement-breakpoint
ALTER TABLE `autorisations_pages` ADD CONSTRAINT `autorisations_pages_page_valide` CHECK (`autorisations_pages`.`page` IN ('sites', 'departements', 'postes', 'personnes', 'profils_horaires', 'rotations', 'groupes', 'affectations', 'horaire_dynamique', 'rapport_presences', 'pointages_manuels', 'evenements', 'absences', 'droits_conges', 'compteurs', 'detail_jour'));