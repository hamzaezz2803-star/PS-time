CREATE TABLE `notifications` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`module` varchar(20) NOT NULL,
	`action` varchar(20) NOT NULL,
	`objet` varchar(30) NOT NULL,
	`libelle` varchar(150),
	`lien` varchar(200),
	`auteur_id` char(36),
	`auteur_nom` varchar(100) NOT NULL,
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `notifications_module_valide` CHECK(`notifications`.`module` IN ('personnel', 'planning', 'presence', 'administration')),
	CONSTRAINT `notifications_action_valide` CHECK(`notifications`.`action` IN ('creation', 'modification', 'suppression'))
);
--> statement-breakpoint
ALTER TABLE `utilisateurs` ADD `notifications_lues_le` datetime(3);--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_auteur_id_utilisateurs_id_fk` FOREIGN KEY (`auteur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `notifications_module_date_idx` ON `notifications` (`module`,`cree_le`);--> statement-breakpoint
CREATE INDEX `notifications_date_idx` ON `notifications` (`cree_le`);--> statement-breakpoint
CREATE INDEX `notifications_auteur_idx` ON `notifications` (`auteur_id`);