CREATE TABLE `compteurs` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`code` varchar(30) NOT NULL,
	`libelle` varchar(100) NOT NULL,
	`formule` varchar(2000) NOT NULL,
	`journalier` boolean NOT NULL DEFAULT false,
	`hebdomadaire` boolean NOT NULL DEFAULT false,
	`mensuel` boolean NOT NULL DEFAULT false,
	`unite` varchar(12) NOT NULL,
	`description` varchar(500),
	`est_actif` boolean NOT NULL DEFAULT true,
	`version` int NOT NULL DEFAULT 1,
	`cree_par` char(36),
	`modifie_par` char(36),
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `compteurs_id` PRIMARY KEY(`id`),
	CONSTRAINT `compteurs_code_idx` UNIQUE(`code`),
	CONSTRAINT `compteurs_libelle_idx` UNIQUE(`libelle`),
	CONSTRAINT `compteurs_code_valide` CHECK(`compteurs`.`code` REGEXP '^[A-Z0-9][A-Z0-9_-]{0,29}$'),
	CONSTRAINT `compteurs_libelle_non_vide` CHECK(CHAR_LENGTH(TRIM(`compteurs`.`libelle`)) > 0),
	CONSTRAINT `compteurs_formule_non_vide` CHECK(CHAR_LENGTH(TRIM(`compteurs`.`formule`)) > 0),
	CONSTRAINT `compteurs_une_periodicite` CHECK(`compteurs`.`journalier` OR `compteurs`.`hebdomadaire` OR `compteurs`.`mensuel`),
	CONSTRAINT `compteurs_unite_valide` CHECK(`compteurs`.`unite` IN ('minutes', 'heures', 'jours', 'nombre', 'pourcentage')),
	CONSTRAINT `compteurs_version_positive` CHECK(`compteurs`.`version` >= 1)
);
--> statement-breakpoint
CREATE TABLE `compteurs_versions` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`compteur_id` char(36) NOT NULL,
	`version` int NOT NULL,
	`formule` varchar(2000) NOT NULL,
	`journalier` boolean NOT NULL,
	`hebdomadaire` boolean NOT NULL,
	`mensuel` boolean NOT NULL,
	`unite` varchar(12) NOT NULL,
	`modifie_par` char(36),
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `compteurs_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `compteurs_versions_compteur_version_idx` UNIQUE(`compteur_id`,`version`)
);
--> statement-breakpoint
ALTER TABLE `compteurs` ADD CONSTRAINT `compteurs_cree_par_utilisateurs_id_fk` FOREIGN KEY (`cree_par`) REFERENCES `utilisateurs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `compteurs` ADD CONSTRAINT `compteurs_modifie_par_utilisateurs_id_fk` FOREIGN KEY (`modifie_par`) REFERENCES `utilisateurs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `compteurs_versions` ADD CONSTRAINT `compteurs_versions_compteur_id_compteurs_id_fk` FOREIGN KEY (`compteur_id`) REFERENCES `compteurs`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `compteurs_versions` ADD CONSTRAINT `compteurs_versions_modifie_par_utilisateurs_id_fk` FOREIGN KEY (`modifie_par`) REFERENCES `utilisateurs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `compteurs_cree_par_idx` ON `compteurs` (`cree_par`);--> statement-breakpoint
CREATE INDEX `compteurs_modifie_par_idx` ON `compteurs` (`modifie_par`);--> statement-breakpoint
CREATE INDEX `compteurs_versions_modifie_par_idx` ON `compteurs_versions` (`modifie_par`);