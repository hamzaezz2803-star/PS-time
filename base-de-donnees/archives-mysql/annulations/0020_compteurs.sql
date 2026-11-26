-- Annule la migration 0020_compteurs (à exécuter à la main, dans phpMyAdmin par exemple).
-- Attention : les compteurs et leurs versions sont perdus.
DROP TABLE IF EXISTS `compteurs_versions`;
DROP TABLE IF EXISTS `compteurs`;
-- Oublie la migration, pour que « npm run db:migrer » puisse la rejouer.
DELETE FROM `__drizzle_migrations` WHERE `created_at` = 1794915750165;
