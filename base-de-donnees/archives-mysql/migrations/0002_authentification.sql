CREATE TABLE `comptes` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`utilisateur_id` char(36) NOT NULL,
	`fournisseur_id` varchar(50) NOT NULL,
	`compte_id` varchar(255) NOT NULL,
	`mot_de_passe` varchar(255),
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `comptes_id` PRIMARY KEY(`id`),
	CONSTRAINT `comptes_fournisseur_compte_idx` UNIQUE(`fournisseur_id`,`compte_id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`utilisateur_id` char(36) NOT NULL,
	`jeton` varchar(255) NOT NULL,
	`expire_le` datetime(3) NOT NULL,
	`adresse_ip` varchar(45),
	`agent_utilisateur` varchar(500),
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_jeton_idx` UNIQUE(`jeton`)
);
--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`identifiant` varchar(255) NOT NULL,
	`valeur` varchar(255) NOT NULL,
	`expire_le` datetime(3) NOT NULL,
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `utilisateurs` ADD `email_verifie` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `comptes` ADD CONSTRAINT `comptes_utilisateur_id_utilisateurs_id_fk` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_utilisateur_id_utilisateurs_id_fk` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `comptes_utilisateur_idx` ON `comptes` (`utilisateur_id`);--> statement-breakpoint
CREATE INDEX `sessions_utilisateur_idx` ON `sessions` (`utilisateur_id`);--> statement-breakpoint
CREATE INDEX `verifications_identifiant_idx` ON `verifications` (`identifiant`);