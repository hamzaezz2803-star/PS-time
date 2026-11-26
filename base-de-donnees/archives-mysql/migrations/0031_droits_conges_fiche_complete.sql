ALTER TABLE `droits_conges` ADD `supplement_1` decimal(4,1) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `droits_conges` ADD `supplement_2` decimal(4,1) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `droits_conges` ADD `supplement_3` decimal(4,1) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `droits_conges` ADD `unite_saisie` varchar(15) DEFAULT 'journee' NOT NULL;--> statement-breakpoint
-- Reprise : un droit qui comptait des demi-journées passe en « demi-journée » (les autres restent à la journée).
UPDATE `droits_conges` SET `unite_saisie` = 'demi_journee' WHERE `jours_acquis` <> FLOOR(`jours_acquis`) OR `jours_reliquat` <> FLOOR(`jours_reliquat`);--> statement-breakpoint
ALTER TABLE `droits_conges` ADD `est_confirme` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `droits_conges` ADD `est_reporte` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `droits_conges` ADD CONSTRAINT `droits_conges_supplement_1_valide` CHECK (`droits_conges`.`supplement_1` BETWEEN 0 AND 366 AND `droits_conges`.`supplement_1` * 2 = FLOOR(`droits_conges`.`supplement_1` * 2));--> statement-breakpoint
ALTER TABLE `droits_conges` ADD CONSTRAINT `droits_conges_supplement_2_valide` CHECK (`droits_conges`.`supplement_2` BETWEEN 0 AND 366 AND `droits_conges`.`supplement_2` * 2 = FLOOR(`droits_conges`.`supplement_2` * 2));--> statement-breakpoint
ALTER TABLE `droits_conges` ADD CONSTRAINT `droits_conges_supplement_3_valide` CHECK (`droits_conges`.`supplement_3` BETWEEN 0 AND 366 AND `droits_conges`.`supplement_3` * 2 = FLOOR(`droits_conges`.`supplement_3` * 2));--> statement-breakpoint
ALTER TABLE `droits_conges` ADD CONSTRAINT `droits_conges_unite_valide` CHECK (`droits_conges`.`unite_saisie` IN ('journee', 'demi_journee', 'heures'));