CREATE TABLE `utilisateurs` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`identifiant` varchar(50) NOT NULL,
	`email` varchar(254) NOT NULL,
	`nom` varchar(100) NOT NULL,
	`mot_de_passe_hash` varchar(255) NOT NULL,
	`doit_changer_mot_de_passe` boolean NOT NULL DEFAULT true,
	`mot_de_passe_modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`est_actif` boolean NOT NULL DEFAULT true,
	`est_super_admin` boolean NOT NULL DEFAULT false,
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `utilisateurs_id` PRIMARY KEY(`id`),
	CONSTRAINT `utilisateurs_identifiant_idx` UNIQUE(`identifiant`),
	CONSTRAINT `utilisateurs_email_idx` UNIQUE(`email`),
	CONSTRAINT `utilisateurs_email_minuscules` CHECK(CAST(`utilisateurs`.`email` AS BINARY) = CAST(LOWER(`utilisateurs`.`email`) AS BINARY)),
	CONSTRAINT `utilisateurs_identifiant_minuscules` CHECK(CAST(`utilisateurs`.`identifiant` AS BINARY) = CAST(LOWER(`utilisateurs`.`identifiant`) AS BINARY)),
	CONSTRAINT `utilisateurs_nom_non_vide` CHECK(CHAR_LENGTH(TRIM(`utilisateurs`.`nom`)) > 0)
);
