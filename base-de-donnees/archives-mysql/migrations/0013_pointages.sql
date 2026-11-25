CREATE TABLE `pointages` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`employe_id` char(36) NOT NULL,
	`horodatage` datetime(3) NOT NULL,
	`etat` varchar(20) NOT NULL,
	`source` varchar(20) NOT NULL DEFAULT 'manuel',
	`remarque` varchar(255),
	`saisi_par` char(36),
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `pointages_id` PRIMARY KEY(`id`),
	CONSTRAINT `pointages_employe_horodatage_etat_idx` UNIQUE(`employe_id`,`horodatage`,`etat`),
	CONSTRAINT `pointages_etat` CHECK(`pointages`.`etat` IN ('entree', 'sortie', 'debut_pause', 'fin_pause', 'debut_heures_sup', 'fin_heures_sup')),
	CONSTRAINT `pointages_source` CHECK(`pointages`.`source` IN ('manuel', 'badgeuse'))
);
--> statement-breakpoint
ALTER TABLE `pointages` ADD CONSTRAINT `pointages_employe_id_employes_id_fk` FOREIGN KEY (`employe_id`) REFERENCES `employes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pointages` ADD CONSTRAINT `pointages_saisi_par_utilisateurs_id_fk` FOREIGN KEY (`saisi_par`) REFERENCES `utilisateurs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `pointages_horodatage_idx` ON `pointages` (`horodatage`);--> statement-breakpoint
CREATE INDEX `pointages_saisi_par_idx` ON `pointages` (`saisi_par`);