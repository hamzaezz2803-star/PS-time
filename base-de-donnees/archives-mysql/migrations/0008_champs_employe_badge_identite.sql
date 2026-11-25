CREATE TABLE `informations_employes` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`employe_id` char(36) NOT NULL,
	`libelle` varchar(60) NOT NULL,
	`valeur` varchar(255) NOT NULL,
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `informations_employes_id` PRIMARY KEY(`id`),
	CONSTRAINT `informations_employes_employe_libelle_idx` UNIQUE(`employe_id`,`libelle`),
	CONSTRAINT `informations_employes_libelle_non_vide` CHECK(CHAR_LENGTH(TRIM(`informations_employes`.`libelle`)) > 0),
	CONSTRAINT `informations_employes_valeur_non_vide` CHECK(CHAR_LENGTH(TRIM(`informations_employes`.`valeur`)) > 0)
);
--> statement-breakpoint
ALTER TABLE `employes` ADD `numero_badge` varchar(30) NOT NULL;--> statement-breakpoint
-- Reprise : les employés existants reçoivent leur matricule comme numéro de badge (modifiable ensuite).
UPDATE `employes` SET `numero_badge` = `matricule`;--> statement-breakpoint
ALTER TABLE `employes` ADD `genre` varchar(10);--> statement-breakpoint
ALTER TABLE `employes` ADD `type_piece_identite` varchar(20);--> statement-breakpoint
ALTER TABLE `employes` ADD `numero_piece_identite` varchar(30);--> statement-breakpoint
ALTER TABLE `employes` ADD `date_debut_emploi` date;--> statement-breakpoint
ALTER TABLE `employes` ADD CONSTRAINT `employes_numero_badge_idx` UNIQUE(`numero_badge`);--> statement-breakpoint
ALTER TABLE `employes` ADD CONSTRAINT `employes_piece_identite_idx` UNIQUE(`type_piece_identite`,`numero_piece_identite`);--> statement-breakpoint
ALTER TABLE `informations_employes` ADD CONSTRAINT `informations_employes_employe_id_employes_id_fk` FOREIGN KEY (`employe_id`) REFERENCES `employes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employes` ADD CONSTRAINT `employes_numero_badge_non_vide` CHECK (CHAR_LENGTH(TRIM(`employes`.`numero_badge`)) > 0);--> statement-breakpoint
ALTER TABLE `employes` ADD CONSTRAINT `employes_genre_valide` CHECK (`employes`.`genre` IS NULL OR `employes`.`genre` IN ('homme', 'femme'));--> statement-breakpoint
ALTER TABLE `employes` ADD CONSTRAINT `employes_type_piece_valide` CHECK (`employes`.`type_piece_identite` IS NULL OR `employes`.`type_piece_identite` IN ('cin', 'passeport', 'carte_sejour'));--> statement-breakpoint
ALTER TABLE `employes` ADD CONSTRAINT `employes_piece_complete` CHECK ((`employes`.`type_piece_identite` IS NULL) = (`employes`.`numero_piece_identite` IS NULL));--> statement-breakpoint
ALTER TABLE `employes` ADD CONSTRAINT `employes_debut_avant_fin` CHECK (`employes`.`date_fin_emploi` IS NULL OR `employes`.`date_debut_emploi` IS NULL OR `employes`.`date_fin_emploi` >= `employes`.`date_debut_emploi`);