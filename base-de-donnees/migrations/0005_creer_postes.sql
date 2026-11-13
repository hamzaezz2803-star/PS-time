CREATE TABLE `postes` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`code` varchar(30) NOT NULL,
	`nom` varchar(100) NOT NULL,
	`ordre` int NOT NULL DEFAULT 99999,
	`parent_id` char(36),
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `postes_id` PRIMARY KEY(`id`),
	CONSTRAINT `postes_code_idx` UNIQUE(`code`),
	CONSTRAINT `postes_parent_nom_idx` UNIQUE(`parent_id`,`nom`),
	CONSTRAINT `postes_code_non_vide` CHECK(CHAR_LENGTH(TRIM(`postes`.`code`)) > 0),
	CONSTRAINT `postes_nom_non_vide` CHECK(CHAR_LENGTH(TRIM(`postes`.`nom`)) > 0),
	CONSTRAINT `postes_ordre_borne` CHECK(`postes`.`ordre` BETWEEN 0 AND 99999),
	CONSTRAINT `postes_pas_son_propre_parent` CHECK(`postes`.`parent_id` IS NULL OR `postes`.`parent_id` <> `postes`.`id`)
);
--> statement-breakpoint
ALTER TABLE `postes` ADD CONSTRAINT `postes_parent_id_postes_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `postes`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `postes_parent_idx` ON `postes` (`parent_id`);