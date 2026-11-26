CREATE TABLE `affectations` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`rotation_id` char(36) NOT NULL,
	`groupe_id` char(36),
	`employe_id` char(36),
	`date_debut` date NOT NULL,
	`date_fin` date,
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `affectations_id` PRIMARY KEY(`id`),
	CONSTRAINT `affectations_une_seule_cible` CHECK((`affectations`.`groupe_id` IS NULL) <> (`affectations`.`employe_id` IS NULL)),
	CONSTRAINT `affectations_dates_coherentes` CHECK(`affectations`.`date_fin` IS NULL OR `affectations`.`date_fin` >= `affectations`.`date_debut`)
);
--> statement-breakpoint
CREATE TABLE `calendriers` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`nom` varchar(60) NOT NULL,
	`debut_minutes` int NOT NULL,
	`fin_minutes` int NOT NULL,
	`pause_minutes` int NOT NULL DEFAULT 0,
	`entree_avant_minutes` int NOT NULL DEFAULT 60,
	`entree_apres_minutes` int NOT NULL DEFAULT 60,
	`sortie_avant_minutes` int NOT NULL DEFAULT 60,
	`sortie_apres_minutes` int NOT NULL DEFAULT 60,
	`retard_tolere_minutes` int NOT NULL DEFAULT 0,
	`depart_anticipe_tolere_minutes` int NOT NULL DEFAULT 0,
	`pointage_entree_obligatoire` boolean NOT NULL DEFAULT true,
	`pointage_sortie_obligatoire` boolean NOT NULL DEFAULT true,
	`heures_sup_actives` boolean NOT NULL DEFAULT false,
	`heures_sup_apres_minutes` int NOT NULL DEFAULT 0,
	`heures_sup_minimum_minutes` int NOT NULL DEFAULT 30,
	`heures_sup_maximum_minutes` int NOT NULL DEFAULT 0,
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `calendriers_id` PRIMARY KEY(`id`),
	CONSTRAINT `calendriers_nom_idx` UNIQUE(`nom`),
	CONSTRAINT `calendriers_nom_non_vide` CHECK(CHAR_LENGTH(TRIM(`calendriers`.`nom`)) > 0),
	CONSTRAINT `calendriers_heures_valides` CHECK(`calendriers`.`debut_minutes` BETWEEN 0 AND 1439 AND `calendriers`.`fin_minutes` BETWEEN 0 AND 1439 AND `calendriers`.`debut_minutes` <> `calendriers`.`fin_minutes`),
	CONSTRAINT `calendriers_pause_bornee` CHECK(`calendriers`.`pause_minutes` BETWEEN 0 AND 720),
	CONSTRAINT `calendriers_fenetres_bornees` CHECK(`calendriers`.`entree_avant_minutes` BETWEEN 0 AND 720 AND `calendriers`.`entree_apres_minutes` BETWEEN 0 AND 720 AND `calendriers`.`sortie_avant_minutes` BETWEEN 0 AND 720 AND `calendriers`.`sortie_apres_minutes` BETWEEN 0 AND 720),
	CONSTRAINT `calendriers_tolerances_bornees` CHECK(`calendriers`.`retard_tolere_minutes` BETWEEN 0 AND 240 AND `calendriers`.`depart_anticipe_tolere_minutes` BETWEEN 0 AND 240),
	CONSTRAINT `calendriers_heures_sup_bornees` CHECK(`calendriers`.`heures_sup_apres_minutes` BETWEEN 0 AND 720 AND `calendriers`.`heures_sup_minimum_minutes` BETWEEN 0 AND 720 AND `calendriers`.`heures_sup_maximum_minutes` BETWEEN 0 AND 1440)
);
--> statement-breakpoint
CREATE TABLE `groupes` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`nom` varchar(60) NOT NULL,
	`description` varchar(255),
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `groupes_id` PRIMARY KEY(`id`),
	CONSTRAINT `groupes_nom_idx` UNIQUE(`nom`),
	CONSTRAINT `groupes_nom_non_vide` CHECK(CHAR_LENGTH(TRIM(`groupes`.`nom`)) > 0)
);
--> statement-breakpoint
CREATE TABLE `jours_rotation` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`rotation_id` char(36) NOT NULL,
	`numero_jour` int NOT NULL,
	`calendrier_id` char(36) NOT NULL,
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `jours_rotation_id` PRIMARY KEY(`id`),
	CONSTRAINT `jours_rotation_rotation_jour_idx` UNIQUE(`rotation_id`,`numero_jour`),
	CONSTRAINT `jours_rotation_numero_borne` CHECK(`jours_rotation`.`numero_jour` BETWEEN 0 AND 30)
);
--> statement-breakpoint
CREATE TABLE `rotations` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`nom` varchar(60) NOT NULL,
	`type` varchar(12) NOT NULL,
	`nombre_jours` int NOT NULL,
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `rotations_id` PRIMARY KEY(`id`),
	CONSTRAINT `rotations_nom_idx` UNIQUE(`nom`),
	CONSTRAINT `rotations_nom_non_vide` CHECK(CHAR_LENGTH(TRIM(`rotations`.`nom`)) > 0),
	CONSTRAINT `rotations_type_et_duree` CHECK((`rotations`.`type` = 'hebdomadaire' AND `rotations`.`nombre_jours` = 7) OR (`rotations`.`type` = 'cycle' AND `rotations`.`nombre_jours` BETWEEN 1 AND 31))
);
--> statement-breakpoint
ALTER TABLE `employes` ADD `groupe_id` char(36);--> statement-breakpoint
ALTER TABLE `affectations` ADD CONSTRAINT `affectations_rotation_id_rotations_id_fk` FOREIGN KEY (`rotation_id`) REFERENCES `rotations`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affectations` ADD CONSTRAINT `affectations_groupe_id_groupes_id_fk` FOREIGN KEY (`groupe_id`) REFERENCES `groupes`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affectations` ADD CONSTRAINT `affectations_employe_id_employes_id_fk` FOREIGN KEY (`employe_id`) REFERENCES `employes`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jours_rotation` ADD CONSTRAINT `jours_rotation_rotation_id_rotations_id_fk` FOREIGN KEY (`rotation_id`) REFERENCES `rotations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jours_rotation` ADD CONSTRAINT `jours_rotation_calendrier_id_calendriers_id_fk` FOREIGN KEY (`calendrier_id`) REFERENCES `calendriers`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `affectations_rotation_idx` ON `affectations` (`rotation_id`);--> statement-breakpoint
CREATE INDEX `affectations_groupe_idx` ON `affectations` (`groupe_id`,`date_debut`);--> statement-breakpoint
CREATE INDEX `affectations_employe_idx` ON `affectations` (`employe_id`,`date_debut`);--> statement-breakpoint
CREATE INDEX `jours_rotation_calendrier_idx` ON `jours_rotation` (`calendrier_id`);--> statement-breakpoint
ALTER TABLE `employes` ADD CONSTRAINT `employes_groupe_id_groupes_id_fk` FOREIGN KEY (`groupe_id`) REFERENCES `groupes`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `employes_groupe_idx` ON `employes` (`groupe_id`);