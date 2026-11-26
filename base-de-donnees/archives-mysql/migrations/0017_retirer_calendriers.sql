-- Les jours de rotation pointaient vers des calendriers : ils sont retirés (à ressaisir avec des profils horaires).
DELETE FROM `jours_rotation` WHERE `profil_id` IS NULL;--> statement-breakpoint
ALTER TABLE `jours_rotation` DROP FOREIGN KEY `jours_rotation_calendrier_id_calendriers_id_fk`;--> statement-breakpoint
DROP INDEX `jours_rotation_calendrier_idx` ON `jours_rotation`;--> statement-breakpoint
ALTER TABLE `jours_rotation` DROP COLUMN `calendrier_id`;--> statement-breakpoint
DROP TABLE `calendriers`;--> statement-breakpoint
ALTER TABLE `jours_rotation` MODIFY COLUMN `profil_id` char(36) NOT NULL;--> statement-breakpoint
CREATE INDEX `jours_rotation_profil_idx` ON `jours_rotation` (`profil_id`);
