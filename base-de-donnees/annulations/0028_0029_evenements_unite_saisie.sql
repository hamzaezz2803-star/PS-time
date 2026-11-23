-- Annule les migrations 0028_evenements_unite_saisie et 0029_evenements_sans_saisi_en_heures
-- (à exécuter à la main, dans phpMyAdmin par exemple). Attention : la demi-journée et le nombre
-- d'heures sont perdus (une demi-journée redevient une journée) ; les périodes de prise supprimées
-- ne reviennent pas (la table est recréée vide : chaque événement peut être pris toute l'année).
ALTER TABLE `evenements` ADD `est_saisi_en_heures` boolean DEFAULT false NOT NULL;
UPDATE `evenements` SET `est_saisi_en_heures` = 1 WHERE `unite_saisie` = 'heures';
ALTER TABLE `evenements` DROP CONSTRAINT `evenements_duree_coherente`;
ALTER TABLE `evenements` DROP CONSTRAINT `evenements_unite_valide`;
ALTER TABLE `evenements` DROP COLUMN `duree_minutes`;
ALTER TABLE `evenements` DROP COLUMN `unite_saisie`;
CREATE TABLE `periodes_evenements` (
	`id` char(36) NOT NULL DEFAULT (uuid()),
	`evenement_id` char(36) NOT NULL,
	`date_debut` date NOT NULL,
	`date_fin` date NOT NULL,
	`cree_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`modifie_le` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	CONSTRAINT `periodes_evenements_id` PRIMARY KEY(`id`),
	CONSTRAINT `periodes_evenements_dates_coherentes` CHECK(`periodes_evenements`.`date_fin` >= `periodes_evenements`.`date_debut`)
);
ALTER TABLE `periodes_evenements` ADD CONSTRAINT `periodes_evenements_evenement_id_evenements_id_fk` FOREIGN KEY (`evenement_id`) REFERENCES `evenements`(`id`) ON DELETE cascade ON UPDATE no action;
CREATE INDEX `periodes_evenements_evenement_idx` ON `periodes_evenements` (`evenement_id`,`date_debut`);
-- Oublie les migrations, pour que « npm run db:migrer » puisse les rejouer.
DELETE FROM `__drizzle_migrations` WHERE `created_at` IN (1795450875390, 1795450890835);
