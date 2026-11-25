ALTER TABLE `comptes` ADD `jeton_acces` text;--> statement-breakpoint
ALTER TABLE `comptes` ADD `jeton_rafraichissement` text;--> statement-breakpoint
ALTER TABLE `comptes` ADD `jeton_identite` text;--> statement-breakpoint
ALTER TABLE `comptes` ADD `jeton_acces_expire_le` datetime(3);--> statement-breakpoint
ALTER TABLE `comptes` ADD `jeton_rafraichissement_expire_le` datetime(3);--> statement-breakpoint
ALTER TABLE `comptes` ADD `portee` varchar(500);--> statement-breakpoint
ALTER TABLE `utilisateurs` ADD `image` varchar(500);