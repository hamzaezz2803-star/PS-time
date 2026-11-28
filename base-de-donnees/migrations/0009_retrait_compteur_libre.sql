-- Retrait du « Compteur libre » du pack standard (n° 16), demande du responsable du 28/11/2026 : le bouton
-- « Nouveau compteur » sert déjà à créer un compteur propre au client. Seul le compteur jamais modifié
-- (formule « 0 », encore à adapter) est retiré, avec ses versions ; un compteur libre réécrit par le client
-- est gardé.
DELETE FROM "compteurs_versions" v
USING "compteurs" c
WHERE v."compteur_id" = c."id" AND c."numero_pack" = 16 AND c."code" = 'COMPTEUR_LIBRE' AND c."est_a_adapter" AND c."formule" = '0';--> statement-breakpoint
DELETE FROM "compteurs"
WHERE "numero_pack" = 16 AND "code" = 'COMPTEUR_LIBRE' AND "est_a_adapter" AND "formule" = '0';
