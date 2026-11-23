DROP TABLE `periodes_evenements`;--> statement-breakpoint
ALTER TABLE `evenements` ADD `unite_saisie` varchar(15) DEFAULT 'journee' NOT NULL;--> statement-breakpoint
ALTER TABLE `evenements` ADD `duree_minutes` int;--> statement-breakpoint
-- Reprise : un événement qui pouvait être saisi en heures devient « Heures », avec 1 h à vérifier dans sa fiche.
UPDATE `evenements` SET `unite_saisie` = 'heures', `duree_minutes` = 60 WHERE `est_saisi_en_heures` = 1;--> statement-breakpoint
ALTER TABLE `evenements` ADD CONSTRAINT `evenements_unite_valide` CHECK (`evenements`.`unite_saisie` IN ('journee', 'demi_journee', 'heures'));--> statement-breakpoint
ALTER TABLE `evenements` ADD CONSTRAINT `evenements_duree_coherente` CHECK ((`evenements`.`unite_saisie` = 'heures' AND `evenements`.`duree_minutes` BETWEEN 1 AND 1440) OR (`evenements`.`unite_saisie` <> 'heures' AND `evenements`.`duree_minutes` IS NULL));
