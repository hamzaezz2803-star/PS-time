CREATE TABLE `sites` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`nom` varchar(100) NOT NULL,
	`adresse` varchar(255),
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `sites_id` PRIMARY KEY(`id`),
	CONSTRAINT `sites_nom_idx` UNIQUE(`nom`),
	CONSTRAINT `sites_nom_non_vide` CHECK(CHAR_LENGTH(TRIM(`sites`.`nom`)) > 0)
);
--> statement-breakpoint
ALTER TABLE `departements` ADD `site_id` char(36);--> statement-breakpoint
ALTER TABLE `employes` ADD `site_id` char(36);--> statement-breakpoint
ALTER TABLE `postes` ADD `site_id` char(36);--> statement-breakpoint
ALTER TABLE `departements` ADD CONSTRAINT `departements_site_id_sites_id_fk` FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employes` ADD CONSTRAINT `employes_site_id_sites_id_fk` FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `postes` ADD CONSTRAINT `postes_site_id_sites_id_fk` FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `departements_site_idx` ON `departements` (`site_id`);--> statement-breakpoint
CREATE INDEX `employes_site_idx` ON `employes` (`site_id`);--> statement-breakpoint
CREATE INDEX `postes_site_idx` ON `postes` (`site_id`);