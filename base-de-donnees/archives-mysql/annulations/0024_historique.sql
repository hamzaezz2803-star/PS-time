-- Annule la migration 0024_historique (à exécuter à la main, dans phpMyAdmin par exemple).
-- Attention : tout l'historique des actions est perdu (les notifications, elles, restent).
DROP TABLE IF EXISTS `historique`;
-- Oublier ensuite la migration dans `__drizzle_migrations` (dernière ligne) pour pouvoir la rejouer.
