CREATE TABLE `droits_conges_pieces_jointes` (
	`droit_id` char(36) NOT NULL,
	`piece_jointe_id` char(36) NOT NULL,
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `droits_conges_pieces_jointes_droit_id_piece_jointe_id_pk` PRIMARY KEY(`droit_id`,`piece_jointe_id`)
);
--> statement-breakpoint
CREATE TABLE `pieces_jointes` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`nom_fichier` varchar(150) NOT NULL,
	`type_mime` varchar(30) NOT NULL,
	`taille_octets` int NOT NULL,
	`contenu` mediumblob NOT NULL,
	`ajoute_par` char(36),
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `pieces_jointes_id` PRIMARY KEY(`id`),
	CONSTRAINT `pieces_jointes_type_mime` CHECK(`pieces_jointes`.`type_mime` IN ('application/pdf', 'image/png', 'image/jpeg', 'image/webp')),
	CONSTRAINT `pieces_jointes_taille` CHECK(`pieces_jointes`.`taille_octets` BETWEEN 1 AND 2097152),
	CONSTRAINT `pieces_jointes_nom_non_vide` CHECK(CHAR_LENGTH(TRIM(`pieces_jointes`.`nom_fichier`)) > 0)
);
--> statement-breakpoint
ALTER TABLE `evenements` ADD `est_soumis_droits` boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Reprise : jusqu'ici, tout événement d'absence pouvait recevoir des droits aux congés.
UPDATE `evenements` SET `est_soumis_droits` = 1 WHERE `type` = 'absence' OR `id` IN (SELECT `evenement_id` FROM `droits_conges`);--> statement-breakpoint
ALTER TABLE `droits_conges_pieces_jointes` ADD CONSTRAINT `droits_conges_pieces_jointes_droit_id_droits_conges_id_fk` FOREIGN KEY (`droit_id`) REFERENCES `droits_conges`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `droits_conges_pieces_jointes` ADD CONSTRAINT `droits_conges_pj_piece_fk` FOREIGN KEY (`piece_jointe_id`) REFERENCES `pieces_jointes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pieces_jointes` ADD CONSTRAINT `pieces_jointes_ajoute_par_utilisateurs_id_fk` FOREIGN KEY (`ajoute_par`) REFERENCES `utilisateurs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `droits_conges_pieces_jointes_piece_idx` ON `droits_conges_pieces_jointes` (`piece_jointe_id`);--> statement-breakpoint
CREATE INDEX `pieces_jointes_ajoute_par_idx` ON `pieces_jointes` (`ajoute_par`);