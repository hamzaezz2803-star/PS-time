CREATE TABLE `historique` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`action` varchar(20) NOT NULL,
	`objet` varchar(30) NOT NULL,
	`module` varchar(20) NOT NULL,
	`libelle` varchar(150),
	`lien` varchar(200),
	`auteur_id` char(36),
	`auteur_nom` varchar(100) NOT NULL,
	`auteur_identifiant` varchar(50),
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `historique_id` PRIMARY KEY(`id`),
	CONSTRAINT `historique_action_valide` CHECK(`historique`.`action` IN ('creation', 'modification', 'suppression', 'connexion', 'deconnexion', 'export')),
	CONSTRAINT `historique_module_valide` CHECK(`historique`.`module` IN ('personnel', 'planning', 'presence', 'administration'))
);
--> statement-breakpoint
ALTER TABLE `historique` ADD CONSTRAINT `historique_auteur_id_utilisateurs_id_fk` FOREIGN KEY (`auteur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `historique_date_idx` ON `historique` (`cree_le`);--> statement-breakpoint
CREATE INDEX `historique_auteur_date_idx` ON `historique` (`auteur_id`,`cree_le`);--> statement-breakpoint
CREATE INDEX `historique_module_date_idx` ON `historique` (`module`,`cree_le`);--> statement-breakpoint
-- Reprise : les actions déjà notées dans la cloche (90 derniers jours) ouvrent l'historique.
INSERT INTO `historique` (`action`, `objet`, `module`, `libelle`, `lien`, `auteur_id`, `auteur_nom`, `auteur_identifiant`, `cree_le`)
SELECT `n`.`action`, `n`.`objet`, `n`.`module`, `n`.`libelle`, `n`.`lien`, `n`.`auteur_id`, `n`.`auteur_nom`, `u`.`identifiant`, `n`.`cree_le`
FROM `notifications` `n`
LEFT JOIN `utilisateurs` `u` ON `u`.`id` = `n`.`auteur_id`;
