CREATE TABLE `autorisations_utilisateurs` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`utilisateur_id` char(36) NOT NULL,
	`module` varchar(20) NOT NULL,
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `autorisations_utilisateurs_id` PRIMARY KEY(`id`),
	CONSTRAINT `autorisations_utilisateur_module_idx` UNIQUE(`utilisateur_id`,`module`),
	CONSTRAINT `autorisations_module_valide` CHECK(`autorisations_utilisateurs`.`module` IN ('personnel', 'planning', 'presence'))
);
--> statement-breakpoint
ALTER TABLE `autorisations_utilisateurs` ADD CONSTRAINT `autorisations_utilisateurs_utilisateur_id_utilisateurs_id_fk` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE cascade ON UPDATE no action;