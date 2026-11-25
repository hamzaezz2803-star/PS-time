CREATE TABLE `champs_personnalises` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`nom` varchar(60) NOT NULL,
	`type` varchar(10) NOT NULL DEFAULT 'texte',
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `champs_personnalises_id` PRIMARY KEY(`id`),
	CONSTRAINT `champs_personnalises_nom_idx` UNIQUE(`nom`),
	CONSTRAINT `champs_personnalises_nom_non_vide` CHECK(CHAR_LENGTH(TRIM(`champs_personnalises`.`nom`)) > 0),
	CONSTRAINT `champs_personnalises_type_valide` CHECK(`champs_personnalises`.`type` IN ('texte', 'nombre', 'date'))
);
--> statement-breakpoint
CREATE TABLE `employes` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`matricule` varchar(30) NOT NULL,
	`prenom` varchar(100) NOT NULL,
	`nom` varchar(100) NOT NULL,
	`departement_id` char(36) NOT NULL,
	`poste_id` char(36),
	`telephone` varchar(16),
	`email` varchar(254),
	`type_emploi` varchar(20),
	`date_embauche` date,
	`date_fin_emploi` date,
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `employes_id` PRIMARY KEY(`id`),
	CONSTRAINT `employes_matricule_idx` UNIQUE(`matricule`),
	CONSTRAINT `employes_email_idx` UNIQUE(`email`),
	CONSTRAINT `employes_matricule_non_vide` CHECK(CHAR_LENGTH(TRIM(`employes`.`matricule`)) > 0),
	CONSTRAINT `employes_prenom_non_vide` CHECK(CHAR_LENGTH(TRIM(`employes`.`prenom`)) > 0),
	CONSTRAINT `employes_nom_non_vide` CHECK(CHAR_LENGTH(TRIM(`employes`.`nom`)) > 0),
	CONSTRAINT `employes_email_minuscules` CHECK(`employes`.`email` IS NULL OR CAST(`employes`.`email` AS BINARY) = CAST(LOWER(`employes`.`email`) AS BINARY)),
	CONSTRAINT `employes_telephone_e164` CHECK(`employes`.`telephone` IS NULL OR `employes`.`telephone` REGEXP '^[+][1-9][0-9]{7,14}$'),
	CONSTRAINT `employes_type_emploi_valide` CHECK(`employes`.`type_emploi` IS NULL OR `employes`.`type_emploi` IN ('cdi', 'cdd', 'interim', 'stage')),
	CONSTRAINT `employes_dates_emploi_coherentes` CHECK(`employes`.`date_fin_emploi` IS NULL OR `employes`.`date_embauche` IS NULL OR `employes`.`date_fin_emploi` >= `employes`.`date_embauche`)
);
--> statement-breakpoint
CREATE TABLE `valeurs_champs_personnalises` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`employe_id` char(36) NOT NULL,
	`champ_id` char(36) NOT NULL,
	`valeur` varchar(255) NOT NULL,
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `valeurs_champs_personnalises_id` PRIMARY KEY(`id`),
	CONSTRAINT `valeurs_champs_employe_champ_idx` UNIQUE(`employe_id`,`champ_id`)
);
--> statement-breakpoint
ALTER TABLE `employes` ADD CONSTRAINT `employes_departement_id_departements_id_fk` FOREIGN KEY (`departement_id`) REFERENCES `departements`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employes` ADD CONSTRAINT `employes_poste_id_postes_id_fk` FOREIGN KEY (`poste_id`) REFERENCES `postes`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `valeurs_champs_personnalises` ADD CONSTRAINT `valeurs_champs_personnalises_employe_id_employes_id_fk` FOREIGN KEY (`employe_id`) REFERENCES `employes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `valeurs_champs_personnalises` ADD CONSTRAINT `valeurs_champs_personnalises_champ_id_champs_personnalises_id_fk` FOREIGN KEY (`champ_id`) REFERENCES `champs_personnalises`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `employes_departement_idx` ON `employes` (`departement_id`);--> statement-breakpoint
CREATE INDEX `employes_poste_idx` ON `employes` (`poste_id`);--> statement-breakpoint
CREATE INDEX `employes_nom_idx` ON `employes` (`nom`,`prenom`);--> statement-breakpoint
CREATE INDEX `valeurs_champs_champ_idx` ON `valeurs_champs_personnalises` (`champ_id`);