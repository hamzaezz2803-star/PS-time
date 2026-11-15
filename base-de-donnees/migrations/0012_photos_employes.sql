CREATE TABLE `photos_employes` (
	`employe_id` char(36) NOT NULL,
	`type_mime` varchar(20) NOT NULL,
	`contenu` mediumblob NOT NULL,
	`taille_octets` int NOT NULL,
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `photos_employes_employe_id` PRIMARY KEY(`employe_id`),
	CONSTRAINT `photos_employes_type_mime` CHECK(`photos_employes`.`type_mime` IN ('image/jpeg', 'image/png', 'image/webp')),
	CONSTRAINT `photos_employes_taille` CHECK(`photos_employes`.`taille_octets` BETWEEN 1 AND 524288)
);
--> statement-breakpoint
ALTER TABLE `photos_employes` ADD CONSTRAINT `photos_employes_employe_id_employes_id_fk` FOREIGN KEY (`employe_id`) REFERENCES `employes`(`id`) ON DELETE cascade ON UPDATE no action;