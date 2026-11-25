ALTER TABLE `employes` ADD `pointage_distance` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `employes` ADD `appareils_distance` varchar(30) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `employes` ADD `distance_exige_position` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `employes` ADD `distance_exige_photo` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `employes` ADD `doigts_a_enroler` varchar(10) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `employes` ADD CONSTRAINT `employes_appareils_distance_valides` CHECK (`employes`.`appareils_distance` REGEXP '^((pc|tablette|telephone)(,(pc|tablette|telephone)){0,2})?$');--> statement-breakpoint
ALTER TABLE `employes` ADD CONSTRAINT `employes_doigts_valides` CHECK (`employes`.`doigts_a_enroler` REGEXP '^[0-9]{0,10}$');--> statement-breakpoint
ALTER TABLE `employes` ADD CONSTRAINT `employes_distance_coherente` CHECK (`employes`.`pointage_distance` = 1 OR (`employes`.`appareils_distance` = '' AND `employes`.`distance_exige_position` = 0 AND `employes`.`distance_exige_photo` = 0));