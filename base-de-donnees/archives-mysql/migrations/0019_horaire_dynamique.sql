CREATE TABLE `regles_horaires` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`debut_minutes` int NOT NULL,
	`fin_minutes` int NOT NULL,
	`jours_semaine` varchar(7) NOT NULL DEFAULT '1234567',
	`profil_id` char(36) NOT NULL,
	`est_actif` boolean NOT NULL DEFAULT true,
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `regles_horaires_id` PRIMARY KEY(`id`),
	CONSTRAINT `regles_horaires_bornes` CHECK(`regles_horaires`.`debut_minutes` BETWEEN 0 AND 1439 AND `regles_horaires`.`fin_minutes` BETWEEN 1 AND 1440 AND `regles_horaires`.`fin_minutes` > `regles_horaires`.`debut_minutes`),
	CONSTRAINT `regles_horaires_jours_valides` CHECK(`regles_horaires`.`jours_semaine` REGEXP '^[1-7]{1,7}$')
);
--> statement-breakpoint
ALTER TABLE `employes` ADD `horaire_dynamique` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `regles_horaires` ADD CONSTRAINT `regles_horaires_profil_id_profils_horaires_id_fk` FOREIGN KEY (`profil_id`) REFERENCES `profils_horaires`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `regles_horaires_profil_idx` ON `regles_horaires` (`profil_id`);