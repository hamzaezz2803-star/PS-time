CREATE TABLE `departements` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`nom` varchar(100) NOT NULL,
	`parent_id` char(36),
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `departements_id` PRIMARY KEY(`id`),
	CONSTRAINT `departements_parent_nom_idx` UNIQUE(`parent_id`,`nom`),
	CONSTRAINT `departements_nom_non_vide` CHECK(CHAR_LENGTH(TRIM(`departements`.`nom`)) > 0),
	CONSTRAINT `departements_pas_son_propre_parent` CHECK(`departements`.`parent_id` IS NULL OR `departements`.`parent_id` <> `departements`.`id`)
);
--> statement-breakpoint
ALTER TABLE `departements` ADD CONSTRAINT `departements_parent_id_departements_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `departements`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `departements_parent_idx` ON `departements` (`parent_id`);