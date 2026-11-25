CREATE TABLE `evenements` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`code` varchar(3) NOT NULL,
	`nom` varchar(60) NOT NULL,
	`type` varchar(10) NOT NULL,
	`est_saisi_en_heures` boolean NOT NULL DEFAULT false,
	`est_prioritaire_sur_pointages` boolean NOT NULL DEFAULT false,
	`est_visible_planning` boolean NOT NULL DEFAULT true,
	`priorite` int NOT NULL DEFAULT 0,
	`code_paie` varchar(20),
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `evenements_id` PRIMARY KEY(`id`),
	CONSTRAINT `evenements_code_idx` UNIQUE(`code`),
	CONSTRAINT `evenements_nom_idx` UNIQUE(`nom`),
	CONSTRAINT `evenements_code_valide` CHECK(`evenements`.`code` REGEXP '^[A-Z0-9]{1,3}$'),
	CONSTRAINT `evenements_nom_non_vide` CHECK(CHAR_LENGTH(TRIM(`evenements`.`nom`)) > 0),
	CONSTRAINT `evenements_type_valide` CHECK(`evenements`.`type` IN ('absence', 'presence')),
	CONSTRAINT `evenements_priorite_bornee` CHECK(`evenements`.`priorite` BETWEEN 0 AND 255)
);
--> statement-breakpoint
CREATE TABLE `periodes_evenements` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`evenement_id` char(36) NOT NULL,
	`date_debut` date NOT NULL,
	`date_fin` date NOT NULL,
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `periodes_evenements_id` PRIMARY KEY(`id`),
	CONSTRAINT `periodes_evenements_dates_coherentes` CHECK(`periodes_evenements`.`date_fin` >= `periodes_evenements`.`date_debut`)
);
--> statement-breakpoint
ALTER TABLE `autorisations_pages` DROP CONSTRAINT `autorisations_pages_page_valide`;--> statement-breakpoint
ALTER TABLE `periodes_evenements` ADD CONSTRAINT `periodes_evenements_evenement_id_evenements_id_fk` FOREIGN KEY (`evenement_id`) REFERENCES `evenements`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `periodes_evenements_evenement_idx` ON `periodes_evenements` (`evenement_id`,`date_debut`);--> statement-breakpoint
ALTER TABLE `autorisations_pages` ADD CONSTRAINT `autorisations_pages_page_valide` CHECK (`autorisations_pages`.`page` IN ('sites', 'departements', 'postes', 'personnes', 'profils_horaires', 'rotations', 'groupes', 'affectations', 'horaire_dynamique', 'rapport_presences', 'pointages_manuels', 'evenements', 'compteurs', 'detail_jour'));