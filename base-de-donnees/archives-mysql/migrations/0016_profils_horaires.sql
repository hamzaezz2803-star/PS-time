CREATE TABLE `plages_profils` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`profil_id` char(36) NOT NULL,
	`debut_minutes` int NOT NULL,
	`fin_minutes` int NOT NULL,
	`type` varchar(15) NOT NULL,
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `plages_profils_id` PRIMARY KEY(`id`),
	CONSTRAINT `plages_profils_profil_debut_idx` UNIQUE(`profil_id`,`debut_minutes`),
	CONSTRAINT `plages_profils_bornes` CHECK(`plages_profils`.`debut_minutes` BETWEEN 0 AND 1439 AND `plages_profils`.`fin_minutes` BETWEEN 1 AND 1440 AND `plages_profils`.`fin_minutes` > `plages_profils`.`debut_minutes`),
	CONSTRAINT `plages_profils_type_valide` CHECK(`plages_profils`.`type` IN ('interdite', 'neutralisee', 'variable', 'fixe', 'repas', 'retard_tolere'))
);
--> statement-breakpoint
CREATE TABLE `profils_horaires` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`code` varchar(3) NOT NULL,
	`nom` varchar(60) NOT NULL,
	`type` varchar(10) NOT NULL DEFAULT 'travail',
	`est_badge` boolean NOT NULL DEFAULT true,
	`repas_minimum_minutes` int,
	`repas_maximum_minutes` int,
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `profils_horaires_id` PRIMARY KEY(`id`),
	CONSTRAINT `profils_horaires_code_idx` UNIQUE(`code`),
	CONSTRAINT `profils_horaires_nom_idx` UNIQUE(`nom`),
	CONSTRAINT `profils_horaires_code_valide` CHECK(`profils_horaires`.`code` REGEXP '^[A-Z0-9]{1,3}$'),
	CONSTRAINT `profils_horaires_nom_non_vide` CHECK(CHAR_LENGTH(TRIM(`profils_horaires`.`nom`)) > 0),
	CONSTRAINT `profils_horaires_type_valide` CHECK(`profils_horaires`.`type` IN ('travail', 'repos')),
	CONSTRAINT `profils_horaires_repas_borne` CHECK((`profils_horaires`.`repas_minimum_minutes` IS NULL OR `profils_horaires`.`repas_minimum_minutes` BETWEEN 0 AND 720) AND (`profils_horaires`.`repas_maximum_minutes` IS NULL OR `profils_horaires`.`repas_maximum_minutes` BETWEEN 0 AND 720))
);
--> statement-breakpoint
ALTER TABLE `jours_rotation` ADD `profil_id` char(36);--> statement-breakpoint
ALTER TABLE `plages_profils` ADD CONSTRAINT `plages_profils_profil_id_profils_horaires_id_fk` FOREIGN KEY (`profil_id`) REFERENCES `profils_horaires`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jours_rotation` ADD CONSTRAINT `jours_rotation_profil_id_profils_horaires_id_fk` FOREIGN KEY (`profil_id`) REFERENCES `profils_horaires`(`id`) ON DELETE restrict ON UPDATE no action;